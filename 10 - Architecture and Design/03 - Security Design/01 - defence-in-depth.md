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
