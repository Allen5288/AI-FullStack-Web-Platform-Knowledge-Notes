# 03 - Provider Abstraction: one client interface, many LLM providers

## 2026-11-25 — Part 1: the narrow interface that made the Azure swap possible

Swapping the Medical AI Assistant from Groq (LLaMA 3) to Azure OpenAI
(GPT-4o) took three days of work — index, cost, generation — and the
generation swap itself was the easy day. The reason: the generation
code already talked to one small interface instead of calling a
provider SDK directly in every place. This note records that pattern
so the next swap is a one-day job, not a rewrite.

### Why abstract at all

- **Price moves.** Groq was ~$0.12 per 100 questions, Azure ~$0.60
  plus $75/month fixed (see EVALUATION.md, Part 4). The cheapest
  provider this quarter is rarely the cheapest next quarter.
- **Outages and limits happen.** A provider's rate limit or outage
  should be a config change, not a code change.
- **Evaluation must be fair.** Comparing two providers only means
  something if both get the same prompt, the same chunks and the
  same temperature. One interface forces that sameness.
- **Lock-in is a cost.** Every provider-specific call sprinkled
  through the code is a future migration ticket.

### The narrow interface

One function, one result shape, one error type. Everything else is
an adapter detail:

```python
from dataclasses import dataclass

@dataclass
class ChatMessage:
    role: str      # "system" | "user" | "assistant"
    content: str

@dataclass
class GenerateResult:
    text: str
    prompt_tokens: int
    completion_tokens: int

class LLMError(Exception):
    """One error type for every provider. `kind` is one of:
    rate_limited | auth | timeout | blocked | provider_error."""
    def __init__(self, kind: str, message: str):
        super().__init__(message)
        self.kind = kind

class LLMClient:
    def generate(self, messages: list[ChatMessage], *,
                 temperature: float = 0.0,
                 max_tokens: int = 512,
                 json_mode: bool = False) -> GenerateResult:
        raise NotImplementedError
```

Rules for keeping the interface narrow:

- Every method you add is a promise to implement N times, once per
  provider. If only one provider needs it, it does not belong in
  the interface — put it behind a capability flag or keep it out
  of the shared path.
- `temperature`, `max_tokens` and `json_mode` are the only knobs in
  the shared path. Provider-only features (Azure content filters,
  Groq tool-use quirks) stay in the adapter. An abstraction that
  hides real differences lies to its callers.
- The result always carries token usage. You cannot do cost-per-100
  (EVALUATION.md, Part 4) if the client swallows usage.

### Adapters: same shape, different wiring

```python
import os

class GroqClient(LLMClient):
    """Groq: OpenAI-compatible API, model name in the request."""
    def __init__(self):
        from groq import Groq, RateLimitError, AuthenticationError, APIConnectionError
        self._client = Groq(api_key=os.environ["GROQ_API_KEY"])
        self._model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        self._errors = (RateLimitError, AuthenticationError, APIConnectionError)

    def generate(self, messages, *, temperature=0.0, max_tokens=512, json_mode=False):
        try:
            resp = self._client.chat.completions.create(
                model=self._model,
                messages=[{"role": m.role, "content": m.content} for m in messages],
                temperature=temperature,
                max_tokens=max_tokens,
                response_format={"type": "json_object"} if json_mode else None,
            )
        except RateLimitError as exc:
            raise LLMError("rate_limited", str(exc)) from exc
        except AuthenticationError as exc:
            raise LLMError("auth", "bad GROQ_API_KEY") from exc
        except APIConnectionError as exc:
            raise LLMError("timeout", str(exc)) from exc
        usage = resp.usage
        return GenerateResult(
            text=resp.choices[0].message.content or "",
            prompt_tokens=usage.prompt_tokens,
            completion_tokens=usage.completion_tokens,
        )

class AzureOpenAIClient(LLMClient):
    """Azure OpenAI: the model is a *deployment name*, plus api-version.
    generate() is identical in shape; only the create() call differs."""
    def __init__(self):
        from openai import AzureOpenAI
        self._client = AzureOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
            api_version=os.environ.get("AZURE_OPENAI_API_VERSION", "2024-10-21"),
        )
        self._deployment = os.environ["AZURE_OPENAI_DEPLOYMENT"]
```

Selection is config, not code:

```python
def make_client(provider: str | None = None) -> LLMClient:
    provider = provider or os.environ.get("LLM_PROVIDER", "groq")
    return {"groq": GroqClient, "azure": AzureOpenAIClient}[provider]()
```

The Medical AI Assistant's `generation.py` does exactly this with a
`PROVIDER` env switch — the swap procedure in EVALUATION.md Part 5
is: set the env vars, re-run the golden set, compare, decide.

### Map provider errors to one error type

Providers fail differently but callers should only care about what
to do next:

| Provider signal | `LLMError.kind` | Caller does |
|---|---|---|
| HTTP 429 | `rate_limited` | Back off and retry (Part 2) |
| HTTP 401 / 403 | `auth` | Fail fast — retrying never fixes a bad key |
| Timeout / 5xx | `timeout` / `provider_error` | Retry once, then fail the question, not the run |
| Content filter 400 | `blocked` | Return the "cannot answer" fallback, count it in eval |

Never pass a provider's raw error body to the end user: it can
contain request ids, deployment names and internal wording. Log it
server-side with the correlation id; return the generic shape.

### What this does not solve

- **Quality differences are real.** GPT-4o and LLaMA 3 do not grade
  the same on the golden set — the interface makes the comparison
  fair, it does not make the answers equal. Re-run eval on every swap.
- **Latency differs.** A provider that is 3x slower changes the
  user experience even when the answers match. Measure it; do not
  assume it.
- **Pricing is per-token and per-model.** The interface returns
  usage, but the cost math still lives in `eval/cost.py` — update
  the price table when a provider changes its price.

## 2026-11-26 — Part 2: retries with back-off, and fallback to a second provider

Part 1 mapped every provider error onto one `LLMError.kind`. That
mapping only pays off if the caller knows what to do with each kind.
Today: the retry and fallback policy that sits on top of the client.

### Retry only what retrying can fix

| `LLMError.kind` | Retry? | Why |
|---|---|---|
| `rate_limited` | Yes — after a back-off | The provider is throttling, not refusing; waiting helps |
| `timeout` / `provider_error` | Yes — once or twice | Transient by nature; a second try often succeeds |
| `auth` | No | A bad key is still bad in 30 seconds; retrying is noise |
| `blocked` | No | The content filter will block the same prompt again |

Retrying `auth` or `blocked` does not fix anything — it burns
tokens, fills logs, and can trip abuse limits. The `kind` field
exists so this decision is one `if`, not a string match on provider
error bodies.

### Exponential back-off with jitter

Wait longer after each failure, and add randomness so a fleet of
retries does not hammer the provider in lockstep:

```python
import random

RETRYABLE = {"rate_limited", "timeout", "provider_error"}

def backoff_seconds(attempt: int, base: float = 1.0, cap: float = 30.0) -> float:
    # attempt 0 -> ~1s, 1 -> ~2s, 2 -> ~4s, capped at 30s, plus jitter
    delay = min(cap, base * (2 ** attempt))
    return delay * random.uniform(0.5, 1.5)
```

Rules: cap the delay (30 s is enough for a chat answer; longer and
the user has left), cap the attempts (3 tries total is the default —
after that, fail the question, not the run), and always jitter. A
fixed 2 s / 4 s / 8 s ladder across many concurrent users becomes a
thundering herd at exactly 8 s; jitter spreads it out.

### The retrying wrapper — policy outside the adapters

```python
import time

class RetryingClient(LLMClient):
    """Wraps any LLMClient with retry + fallback. No provider code here."""

    def __init__(self, primary: LLMClient, fallback: LLMClient | None = None,
                 max_attempts: int = 3):
        self._primary = primary
        self._fallback = fallback
        self._max_attempts = max_attempts

    def generate(self, messages, *, temperature=0.0, max_tokens=512, json_mode=False):
        client, attempts = self._primary, 0
        while True:
            try:
                return client.generate(messages, temperature=temperature,
                                       max_tokens=max_tokens, json_mode=json_mode)
            except LLMError as exc:
                attempts += 1
                if exc.kind not in RETRYABLE or attempts >= self._max_attempts:
                    if client is self._primary and self._fallback is not None:
                        # One switch to the fallback, then its own retries.
                        client, attempts = self._fallback, 0
                        continue
                    raise
                time.sleep(backoff_seconds(attempts - 1))
```

Three decisions baked in here:

- **Fallback is a second provider, not a second try.** Groq
  rate-limited at 429 → try Azure when it is its turn. A fallback
  to the same provider is just a fourth retry with extra steps.
- **Fallback happens once.** If Azure also fails, the question
  fails with a clean error. A chain of fallbacks hides which
  provider is actually broken and makes cost unpredictable.
- **The wrapper knows nothing about providers.** It takes two
  `LLMClient`s. Swapping Groq for Azure in either slot is a config
  change in `make_client`, not a code change here.

### What to measure

Log every retry and fallback with the correlation id, the kind, and
the attempt number. Two numbers to watch in eval:

- **Retry rate** — retries per 100 questions. A sudden rise means
  the provider is throttling you (or your traffic grew past the
  tier), not that your code broke.
- **Fallback rate** — how often the second provider answers. If it
  is above ~5%, the primary is the wrong tier or the wrong
  provider; fix the plan, not the retry count. And remember the
  fallback answers cost fallback prices — the cost math in
  `eval/cost.py` needs both providers' prices.

### What this does not solve

- **Retries cannot fix quality.** A model that answers badly on the
  first try answers badly on the third. Re-run the golden set; do
  not retry your way to a good answer.
- **A fallback is not a load balancer.** Sending half your traffic
  to each provider on purpose is a routing decision with its own
  cost and quality trade-offs — that is a design decision of its
  own, not a side effect of error handling.

### What I will add next in this file

- Part 3: structured outputs across providers — JSON mode vs
  function calling vs "ask for JSON and validate it yourself".
