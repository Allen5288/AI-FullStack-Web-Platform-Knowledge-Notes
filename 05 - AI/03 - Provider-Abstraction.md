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

## 2026-11-27 — Part 3: structured outputs across providers — JSON mode, function calling, or validate it yourself

Part 1 built one client interface with a `json_mode` flag. Part 2
put retries on top. Today: what that flag is actually for — getting
a JSON object back from a model that only promises text — and the
three ways to do it, because they fail differently and cost
differently.

### The problem: downstream code needs an object, the model returns text

The Real Estate assistant (commit 5) will need this for real: turn
"3 bed house in The Ponds under $1.2m" into
`{"suburb": "The Ponds", "min_beds": 3, "max_price": 1200000}` and
hand those filters to the retriever. If the model answers in prose
— "You'd like a 3-bedroom house…" — the retriever cannot use it.
The answer must be parseable, every time, or the feature does not
work. Three approaches, in order of strength.

### Approach 1: JSON mode — valid JSON, not a valid schema

Ask the provider for JSON and it returns JSON. Both providers in
Part 1 support it (`response_format={"type": "json_object"}`), which
is why `json_mode` is already in the shared interface:

```python
result = client.generate(
    [ChatMessage("system", "Extract the search filters as JSON."),
     ChatMessage("user", "3 bed house in The Ponds under $1.2m")],
    json_mode=True,
)
filters = json.loads(result.text)  # parses — but is it the right shape?
```

What JSON mode guarantees: the output parses as JSON. What it does
**not** guarantee: the right keys, the right types, or true values.
`{"suburb": "The Ponds", "min_beds": "three"}` is valid JSON and
useless. JSON mode removes the syntax problem only — you still need
the validation in approach 3. Its other limit: it is a request, not
a contract. A provider without JSON mode (or an older model) ignores
it, so code that depends on the flag alone breaks on the next swap.
Treat JSON mode as a hint that makes approach 3 succeed more often,
never as the validation itself.

### Approach 2: function calling / tool use — the strongest guarantee

Give the model a function schema and it returns structured arguments
instead of text:

```json
{"name": "search_listings",
 "arguments": {"suburb": "The Ponds", "min_beds": 3, "max_price": 1200000}}
```

This is the strongest of the three: the provider validates the
arguments against the schema before returning them, so wrong types
mostly never arrive. The cost is that it does **not** fit the narrow
interface from Part 1 — Groq and Azure express tools differently,
and the response shape (tool calls, not text) is a second return
path. That is why it stays out of `LLMClient`: put it behind a
capability flag (`client.supports_tools`), or in a separate
`ToolClient`, and only use it where the schema is the product — an
agent calling tools, not a chat answer. Do not bend the shared
interface around one provider's tool format; the next swap will
break it.

### Approach 3: ask for JSON and validate it yourself — works everywhere

The portable approach, and the default for this codebase: prompt for
JSON, parse it, validate it against a schema in your own code, and
treat failure as a normal error, not an exception:

```python
import json
from pydantic import BaseModel, Field, ValidationError

class SearchFilters(BaseModel):
    suburb: str | None = None
    min_beds: int | None = Field(default=None, ge=1, le=10)
    max_price: int | None = Field(default=None, gt=0)
    status: str | None = Field(default=None, pattern="^(sale|rent)$")

def parse_structured(text: str) -> SearchFilters:
    """Parse model output into validated filters. Raises ValueError
    with a message the repair retry can use — never returns a
    half-parsed object."""
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"not valid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise ValueError("JSON is not an object")
    try:
        return SearchFilters(**data)
    except ValidationError as exc:
        raise ValueError(f"wrong shape: {exc.errors()}") from exc
```

Three failure kinds, three different responses:

| Failure | Example | Response |
|---|---|---|
| Not JSON at all | Prose, or JSON wrapped in markdown fences | Strip fences, retry once with the parse error in the prompt |
| JSON, wrong shape | `min_beds: "three"`, unknown keys | One repair retry, then fail the question |
| JSON, valid shape, wrong values | `min_beds: 99`, `max_price: -5` | No retry — the model understood the shape and still chose a nonsense value; fail the question |

Rules that follow:

- **Validate with a schema, not with `if` chains.** Pydantic
  gives you types, ranges and unknown-field rejection in one place,
  and the error message is good enough to feed back to the model.
  Unknown fields are rejected, not ignored — a model inventing a
  `moat: true` field should be told, not silently accommodated.
- **Defaults live in code, not in the model.** `status` defaults to
  `None` (no filter) in the schema; the model never decides what
  "no filter" means.
- **One repair retry, then stop.** Feed the validation error back
  ("`min_beds` must be an integer 1–10, you gave `\"three\"`") and
  try once. A model that cannot produce the schema in two tries
  will not on the third, and each retry costs tokens and latency.
  Log the raw text on failure — it is eval data (Part 4 of the RAG
  notes: one failure class is "structured output failed").
- **Never fall back to a guessed object.** If parsing fails, the
  answer is "I could not understand the filters — please tell me
  the suburb and budget", not a filter object built from a regex
  over the model's prose. A guessed filter returns the wrong
  listings, which is worse than no listings.

### Which approach, when

| Situation | Use |
|---|---|
| One object out of a chat answer, any provider | Approach 3 (validate yourself) + JSON mode as a hint |
| The schema is the product (agent tools, form filling) | Approach 2 (function calling), behind a capability flag |
| A provider with no JSON mode at all | Approach 3 only — it is the only one that works everywhere |

### What this does not solve

- **JSON mode does not stop hallucinated values.** A model can
  return perfectly valid JSON with a price no listing has. Schema
  validation checks shape; faithfulness (RAG notes, Part 3) checks
  facts. Both are needed — shape without facts is a confident lie
  in brackets.
- **Structured output does not fix a bad prompt.** If the model
  cannot tell a suburb from a street, no format flag will teach
  it. That is a prompt and eval problem, not a parsing problem.

## 2026-11-27 — Part 4: streaming responses and token budgets

Parts 1-3 built a client that returns one finished answer: `generate()` gives back the whole text, token usage and a clean error. That shape is fine for a RAG evaluation run, where nobody is waiting. It is the wrong shape for a user staring at a chat box. Today: streaming — sending the answer token by token as it is generated — and the token budget that decides what fits in the prompt in the first place.

### Why stream at all

- **Time to first token (TTFT) is the user experience.** A 20-second answer that starts in 1 second feels fast; a 20-second answer that starts in 20 seconds feels broken. Streaming does not make the model faster — it makes the wait visible, and a visible wait is tolerable.
- **A long answer can be cancelled.** If the first paragraph is already wrong, the user stops it instead of paying for 800 more tokens. Without streaming, the whole answer is generated, paid for, and then thrown away.
- **It is still the same generation.** Streaming changes delivery, not the model, the prompt or the eval. The golden set still grades the finished text.

### The streaming interface

Add one method to the client from Part 1. It yields events, not one result, and usage usually arrives only at the end — do not trust a token count until the `done` event:

```python
from dataclasses import dataclass
from typing import Iterator

@dataclass
class StreamEvent:
    kind: str          # "delta" | "done" | "usage"
    text: str = ""     # delta text, empty for done/usage
    prompt_tokens: int = 0
    completion_tokens: int = 0

class LLMClient:
    # generate() from Part 1 stays as-is.
    def stream(self, messages: list[ChatMessage], *,
               temperature: float = 0.0,
               max_tokens: int = 512) -> Iterator[StreamEvent]:
        raise NotImplementedError
```

Rules for the caller:

- **Accumulate, then display.** Keep a `full_text` buffer and append every delta to it. The buffer is the answer; the deltas are only the delivery. Eval, logging and citation checks (RAG notes, Part 3) all run on the buffer, never on one delta.
- **Do not parse a partial answer.** A streamed JSON object is invalid JSON until the last `}` arrives. If the answer is structured output (Part 3), buffer it and validate it once, at the end. Show raw text while it streams, or show nothing until it is complete — never show a half-parsed object.
- **Not every provider supports streaming the same way.** Groq and Azure both stream, but the event shape and when usage arrives differ. That is adapter work, exactly like Part 1: the interface above is the shared shape, the adapter translates. If a provider cannot stream, the adapter can fake it by calling `generate()` once and yielding the whole text as one delta — slow, but the caller never knows. Put that behind a capability flag, not a second code path in the caller.

### Token budgets: what fits in the prompt

Every model has a context window — the total tokens for prompt + answer. A budget is how you spend it before you call the model:

```python
@dataclass
class TokenBudget:
    context_window: int      # e.g. 128_000 for the model in use
    reserve_completion: int  # tokens kept aside for the answer, e.g. 1_024
    safety_margin: int = 512 # room for the system prompt growing, and for counting error

    @property
    def prompt_budget(self) -> int:
        return self.context_window - self.reserve_completion - self.safety_margin
```

- **Count tokens, do not guess them.** "Roughly 4 characters per token" is fine for a back-of-envelope estimate and wrong for a budget. Use the provider's tokenizer (for example `tiktoken` for OpenAI-family models) on the exact messages you will send. Count the system prompt, the retrieved chunks, the conversation history and the question — all of it.
- **The answer needs a reserve.** If the prompt eats the whole window, `max_tokens` is silently cut to whatever is left, and the answer is truncated mid-sentence. Reserve the completion tokens first, then budget the prompt against what remains. The reserve is a product decision, not a model one: a one-line filter answer needs 256 tokens; a grounded RAG answer with citations needs 1,024.
- **When the prompt is over budget, cut in a fixed order.** First the oldest conversation turns, then the lowest-scoring retrieved chunks, and never the question or the system prompt. Cutting the question to fit the chunks is how a RAG answer ends up fluent, confident and about the wrong thing. Log what was cut and how many tokens it saved — that is eval data, and it is also the first thing to check when answers get worse after a retrieval change.
- **A budget is per call, not per model.** Two providers with different context windows need two budgets. The budget lives next to the adapter config, not in shared code, for the same reason the model name does (Part 1).

### Cancelling a runaway generation

Streaming is what makes cancelling possible, and cancelling is a cost control, not just a UX nicety:

- **Stop reading the stream and close the connection.** The provider stops generating (or stops sending), and you stop paying for tokens that would have followed. You still pay for the tokens already generated — cancelling is not free, it is cheaper than the full answer.
- **Log the partial answer and the reason.** "User cancelled after 312 tokens" and "cancelled by the 30-second timeout after 0 tokens" are different problems. The first is a quality signal; the second is a provider or prompt problem.
- **A timeout is a budget too.** Cap the total streaming time (30 seconds is a reasonable default for a chat answer) and cancel past it. A generation that has not finished in 30 seconds is unlikely to finish well, and the user has already left.

### Why streaming changes the retry story from Part 2

Part 2 said: retry retryable errors, then fall back once to a second provider. That rule only works before the user has seen anything:

- **Retry only before the first token.** If the stream fails before the first delta, nothing has been shown — retry or fall back exactly as in Part 2, and the user never knows.
- **After the first delta, never silently retry.** The user has already read half an answer. A retry would either show a second, different answer underneath the first, or silently replace text the user has already read. Both are worse than a visible failure. The correct response is to stop, keep the partial text on screen, and say the answer was cut off — with a retry button the user chooses to press.
- **Fallback after streaming started is worse than no fallback.** Two providers would produce two different partial answers. The fallback is for a failed call, not a half-finished one. If the primary fails mid-stream, the question fails visibly; log it, count it, and fix the provider or the prompt.
- **Structured outputs make this sharper.** A half-streamed JSON object cannot be repaired by retrying the same prompt mid-stream. The repair retry from Part 3 happens on the complete buffered text, after the stream ends — never inside the stream.

Practical rule: the streaming caller has two states, "nothing shown yet" and "something shown". Retries and fallbacks belong to the first state only.

### What to measure

- **TTFT** — time to first token. Watch it per provider; a provider that is cheap but slow to start loses the streaming benefit.
- **Tokens per second while streaming** — a stalled stream feels like a hang, even if the total time is fine.
- **Cancelled rate** — cancellations per 100 answers, and tokens generated before cancellation. A rising rate means the first paragraph is going wrong, not that users are impatient.
- **Budget overflow rate** — how often the prompt had to be cut to fit. If it rises after a retrieval change, the retrieval change is the problem.

### What this does not solve

- **Streaming does not fix a bad answer faster.** It shows a bad answer sooner. Eval on the finished text (RAG notes) is still the only quality check.
- **Token budgets do not fix a bad retrieval.** Cutting chunks to fit the window hides the fact that too much was retrieved. If the overflow rate is high, retrieve less, not just cut more.
- **Streaming does not make the answer cheaper.** It makes the same tokens visible earlier, and makes cancelling possible. Total cost per finished answer is unchanged; cost per cancelled answer goes down.

### What I will add next in this file

- Part 5: caching and cost-aware routing — prompt caching, a semantic cache for repeated questions, and routing a question to the cheap model or the strong model based on what the question needs.
