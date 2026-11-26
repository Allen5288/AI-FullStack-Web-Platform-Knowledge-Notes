# Defence in Depth — Designing a System That Fails Closed, Layer by Layer

> Daily note, started 2026-11-24. Principal-engineer level design
> for security architecture: how to layer defences so that one
> failure is a logged event, not a breach. This file will be extended
> over the next few days — one design topic, one file, dated sections.

## 2026-11-24 — Part 1: the layers, and what each one is allowed to trust

### The idea in one paragraph

Defence in depth means no single layer is trusted to be perfect. Each layer assumes the layer outside it has already failed, and still has to hold: the edge assumes the client is hostile, the app assumes the edge let something through, the data layer assumes the app is compromised. A system is only as strong as its weakest layer, so the design question is never "is this layer secure?" but "what happens when this layer fails?"

### The layers, outside in

| Layer | Owns | Assumes the outside failed, so it... |
|---|---|---|
| Edge / network | TLS, WAF, rate limiting, IP allow-lists | ...still validates every request as if it came from the open internet |
| Identity | Auth, tokens, MFA, least-privilege roles | ...checks the token on every call, never trusts a header the client set |
| Application | Input validation, authorisation, error handling | ...validates and authorises at the boundary, even for internal callers |
| Data | Encryption at rest, per-tenant isolation, backups | ...encrypts and scopes every query by tenant, even if the app is breached |
| AI / model | Prompt guardrails, output filtering, retrieval filters | ...treats tool output and retrieved text as untrusted input, never as instructions |
| Observability | Logs, alerts, audit trail | ...records enough to reconstruct an incident after the fact |

### The rules that make the layers work

1. **Fail closed.** When a check cannot run — the auth service is down, the filter errors — deny, do not allow. A failed-open check is worse than no check: it looks like protection while letting everything through.
2. **Validate at the boundary, authorise at the resource.** Validation ("is this input well-formed?") happens where data enters; authorisation ("may this user touch this record?") happens where the record is read, with the tenant/user id from the token — never from a client-supplied field.
3. **Least privilege, per layer.** Each layer gets the smallest access it needs: the app's database user can read/write only its own tables; the queue trigger can read one queue and write one table; a compromised function cannot reach the whole database.
4. **Secrets never travel with the code.** Connection strings and keys live in the platform secret store (Key Vault, Secrets Manager, app settings) and arrive as environment variables. A leaked repo is an embarrassment; a leaked repo with keys in it is a breach.
5. **Never trust the model's input or output.** Retrieved chunks and tool results are data, not instructions — prompt injection arrives exactly that way. And model output is untrusted text until it passes the same validation as any other user input.

### Worked mapping — the two systems in this collection

**Async User Register API (AWS + Azure mirror).** The HTTP trigger validates the body and the idempotency key (application layer); Cosmos DB / DynamoDB uniqueness is the second guard against duplicate users (data layer); the Service Bus / SQS queue means a bad message is retried then dead-lettered, not lost or endlessly retried (edge of the async boundary). What is still missing, and next: API Management keys in front of the HTTP trigger (identity layer), and per-tenant scoping if the API ever serves more than one client.

**Medical AI Assistant (RAG).** Retrieval filters by `tenant_id` before vector search (data layer) — one tenant's PDFs never leak into another's answers, even if the app layer has a bug. The generation prompt requires citations from retrieved chunks only (AI layer), and the faithfulness check fails any answer with an unsupported claim. What is still missing: an output filter for disallowed medical advice, and an audit log of which chunks supported each answer, so a bad answer can be traced back to its source.

### What this sets up

The next parts in this folder take one layer each and go deep: identity and token design, tenant isolation in the data layer, and AI-specific threats (prompt injection, data exfiltration through the model).


## 2026-11-27 — Part 2: identity and token design — what a token is, and what it is not

Part 1 said the identity layer "checks the token on every call".
Today that layer gets its design: tokens are the currency of
identity, and most token bugs are not crypto bugs — they are design
bugs about lifetime, storage and revocation.

### Three tokens, three jobs

One sign-in produces three different things. Confusing them is the
most common identity mistake:

| Token | Proves | Lifetime | If stolen |
|---|---|---|---|
| **ID token** | Who the user is (name, email, `sub`) | Minutes | The thief knows who you are — they cannot act as you |
| **Access token** | What the client may do, right now | Short: 15–60 min | Useful for at most an hour — then it dies on its own |
| **Refresh token** | The right to ask for a new access token | Long: days–30 days | Full account access until revoked — guard it hardest |

The access token is the only one the API checks on each call. The
ID token is for the client to display ("signed in as Allen"), never
for authorisation — an API that accepts an ID token as an access
token has confused "who you are" with "what you may do". The
refresh token never leaves the client–identity-provider exchange:
it is never sent to the API, never put in a URL, never logged.

### Lifetime is the security control

A token's lifetime is how long a stolen token is useful. That is
the whole trade-off:

- **Short access tokens (15–60 min)** bound the damage. A token
  scraped from a log is dead within the hour. The cost is refresh
  traffic — the client silently swaps the refresh token for a new
  access token, so the user never notices.
- **Rotating refresh tokens** close the remaining hole. Each refresh
  returns a *new* refresh token and invalidates the old one. If an
  old refresh token is ever presented twice, something is wrong —
  the token was stolen and both the thief and the real user are
  refreshing. The correct response is to revoke the whole token
  family (every token from that sign-in) and force a fresh login.
  Cognito supports rotation; turn it on instead of issuing one
  long-lived refresh token that never changes.
- **Never a token that does not expire.** A "remember me" that is
  really a permanent token is a password that cannot be changed.

### Where tokens live — the storage decision

| Place | Risk |
|---|---|
| `localStorage` / `sessionStorage` | Any script on the page can read it. One XSS hole leaks every token. Do not use it. |
| `httpOnly`, `Secure`, `SameSite` cookie | The browser sends it automatically; JavaScript cannot read it. The right default for a browser client. Needs CSRF protection, because the browser sends it on every request — a `SameSite=Lax` cookie plus an anti-CSRF token, or `SameSite=Strict` where the UX allows. |
| Memory only (SPA) | Safest from XSS theft, but a page reload loses the session — pair it with a refresh-token cookie and silent refresh. |
| Mobile secure storage | Keychain / Keystore, not plain files. Same rule as cookies: the OS guards it, the app does not. |

And the negatives, which are rules, not preferences: never put a
token in a URL (URLs land in logs, browser history and referrer
headers), never log a token (log the `sub` and the token's `jti`,
never the token), never commit a token, never email one.

### Verify every time — and prefer the platform's verifier

A JWT is a signed JSON blob. Accepting it without checking the
signature is accepting a note the client wrote itself. Every call,
check all five: signature against the issuer's JWKS (cached, with
rotation), `iss` is your identity provider, `aud` / `client_id` is
your app, `exp` has not passed, `token_use` is `access`. Do not
hand-roll this: use the platform authorizer — API Gateway's JWT
authorizer, Azure API Management's `validate-jwt` policy — so the
Lambda / Function never sees an unverified token at all. The
authorizer runs before your code, which is exactly where the
identity layer belongs (Part 1: the edge assumes the client is
hostile).

### Service-to-service: no user tokens downstream

When the API calls another service, it must not forward the user's
access token. That is the confused-deputy problem: the downstream
service cannot tell whether the call came from the user or from a
compromised API, and the token's scope is the user's, not the
service's. Services authenticate as themselves — managed identity
(Azure), IAM role (AWS), or mutual TLS — with short-lived tokens
scoped to the one thing they need. The user token stops at the
first service boundary.

### Revocation, honestly

A stateless JWT cannot be revoked individually — that is the price
of not calling the identity provider on every request. The design
accepts it and compensates:

- **Short access tokens** make revocation mostly unnecessary: the
  token dies on its own within the hour.
- **Revoke the refresh token** to end a session (logout, ban, stolen
  device). The access token still works for up to an hour — a known
  gap, priced and accepted, not a surprise.
- **A denylist is for emergencies only** ("log out everywhere,
  now"). It needs a lookup on every request, which is a database
  call on the hot path — the thing stateless tokens were meant to
  avoid. Use it for incidents, not for routine logout.

### Worked mapping — the two systems in this collection

- **Async User Register API.** Cognito User Pool (AWS notes,
  2026-11-25): the JWT authorizer checks the token; the Lambda
  then authorises with `sub` — only the board creator edits the
  board. On the Azure mirror, API Management's `validate-jwt`
  policy does the same job against Entra ID. The refresh-token
  rotation above is the setting to turn on in the app client.
- **Medical AI Assistant (RAG).** The `tenant_id` that scopes
  retrieval comes from the token claim, never from the request
  body. A client that can set its own tenant id can read another
  tenant's documents — Part 1's rule ("authorise at the resource,
  with the id from the token") applied to the AI layer. The token
  is also what the audit log records: which `sub` asked which
  question, and which chunks supported the answer.

### Checklist before the next deploy

- [ ] Access tokens 1 hour or less; refresh rotation on, reuse
      detected and revokes the family
- [ ] Tokens in `httpOnly` cookies (browser) or secure storage
      (mobile); nothing in `localStorage`, nothing in URLs, nothing
      in logs
- [ ] Authorizer (API Gateway / APIM) verifies signature, `iss`,
      `aud`, `exp`, `token_use` before the function runs
- [ ] Revocation path tested: revoke refresh token, confirm the
      next refresh fails

### What I will add next in this folder

- Part 3: tenant isolation in the data layer — one database or many,
  row-level scoping, and what happens when the scoping check is missed.
