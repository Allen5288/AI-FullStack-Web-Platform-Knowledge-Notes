# Layered Architecture — the Default Shape of a Full-Stack System

> Architecture & Design note, started 2026-11-22. One design topic,
> one file, dated sections — the same rule as the rest of this repo.
> This folder rotates through four lenses: 01 - Full Stack Design,
> 02 - AI Design, 03 - Security Design, 04 - Cloud Design.
> Today: Full Stack.

## 2026-11-22 — Why layers, and what they cost

Every full-stack system eventually faces the same failure: the HTTP
handler talks to the database, a business rule lives inside a
controller, and changing the database means touching every file.
Layered architecture is the boring fix — split the code into layers
with one rule: **dependencies point inward, and an inner layer never
knows about an outer one.**

### The four layers

| Layer | Job | Knows about |
|---|---|---|
| Presentation | Parse input, return responses (HTTP trigger, controller, React component) | Application only |
| Application | Orchestrate a use case: validate, call the domain, publish events | Domain, infrastructure interfaces |
| Domain | The business rules — what makes a registration valid, what "pending" means | Nothing (pure code, no framework imports) |
| Infrastructure | The outside world: database, queue, email, third-party APIs | Domain interfaces it implements |

### Worked example: the async user registration API

The same registration flow from the Azure-Apps-Collection repo,
mapped onto layers:

| Step | Layer | Code |
|---|---|---|
| Parse JSON, return 400 on bad input | Presentation | `RegisterUser/__init__.py` |
| Validate email/name, build the record, publish the event | Application | the trigger's `main()` orchestration |
| Email format, idempotency-key rule, `pending -> active` | Domain | `shared/models.py` — no Azure imports |
| Cosmos DB write, Service Bus publish | Infrastructure | `CosmosClient`, `ServiceBusClient` calls |

Because the domain has no Azure imports, the same `models.py` is
reused by the queue trigger that processes registrations — and the
whole flow can be tested without a database, by swapping the
infrastructure layer for fakes.

### Trade-offs: layers vs the alternatives

| Shape | Wins when | Costs you |
|---|---|---|
| Layered (this note) | A team needs one shared shape; rules must survive a framework swap | Indirection — a one-line change can touch three files |
| Vertical slices | Features ship independently; each slice owns its UI-to-DB path | Shared rules drift — the same validation gets written twice |
| Microservices | Teams deploy independently; services scale separately | Distributed-system problems: latency, partial failure, versioning |

The rule of thumb: start layered inside one deployable unit. Split
into services only when a team boundary or a scaling boundary forces
it — never because the diagram looks cleaner.

### When layers hurt

- A small CRUD app with no real business rules: the layers are
  ceremony. A single handler plus a repository is enough.
- Over-abstraction: an interface for every class, a factory for every
  object. If a layer exists only to forward calls, delete it.
- Leaking the database upward: returning a Cosmos DB item (with `_etag`,
  `_ts`) from the domain. The domain should return its own types; the
  infrastructure layer translates at the boundary.

### Decision record (ADR) — the template to use for big calls

```text
# ADR-001: <short title>
Date: 2026-11-22
Status: accepted | rejected | superseded by ADR-00N
Context: what problem, what constraints (cost, team, deadline)?
Decision: what we chose, in one paragraph.
Alternatives: what we rejected, and why (one line each).
Consequences: what gets harder because of this choice?
```

Write the ADR when the decision is hard to reverse — a database, a
cloud provider, a public API shape. Skip it for anything a single
refactor can undo.

### Scale and cost, honestly

Layers do not make a system scale. They make it *changeable*: the
database, the queue, and the framework can each be replaced without
rewriting the rules. Scaling happens at the infrastructure layer —
more instances, a bigger Cosmos DB throughput, a partitioned queue —
and the domain never notices. If someone sells you layers as a
scaling strategy, they are selling the wrong thing.

### What I will add next in this folder

- 2026-11-23: 02 - AI Design — agent orchestration patterns: when an
  agent needs tools, memory, and a human in the loop.
- Later: 03 - Security Design (threat modelling a public API), then
  04 - Cloud Design (multi-region and cost).
