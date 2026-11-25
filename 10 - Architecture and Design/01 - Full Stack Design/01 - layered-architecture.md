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

## 2026-11-26 — Vertical slices: when a feature owns its own path

The 22 Nov note made layers the default shape: dependencies point
inward, the domain knows nothing about the outside world. That is
still the default. But layers have a cost the note named honestly —
a one-line change can touch three files — and when a system grows
by adding features, that cost compounds. Vertical slices are the
alternative shape, and the choice between them is a real design
decision, not a style preference.

### What a slice is

One feature, end to end, in one place: the HTTP handler, the
validation, the business rule, the database call, and the response
shape all live together, usually in one folder per feature.

```text
features/
  register-user/
    handler.py      # parse input, return 202
    validate.py     # email / name rules for this feature
    store.py        # Cosmos DB write for this feature
  book-inspection/
    handler.py
    validate.py
    store.py
```

There is no shared application layer to cross and no domain layer
to consult. A new feature is a new folder; deleting a feature is
deleting a folder. That is the whole appeal — and the whole risk.

### When slices beat layers

| Situation | Better shape | Why |
|---|---|---|
| Features ship and change independently | Slices | A change to booking never touches registration code |
| One team, one deployable, fast iteration | Slices | Less indirection; a feature is readable in one sitting |
| Rules must stay identical across features | Layers | One domain layer is one place where the rule lives |
| Many features share one core concept (a user, an order) | Layers | Slices duplicate the core concept until they drift apart |
| A framework or database swap is planned | Layers | The swap touches the infrastructure layer, not every slice |

The pattern in our own work: the BookingApi (NodeJS) and the Real
Estate Enquiry Assistant (AI Apps) are both slice-shaped in
practice — each endpoint owns its validation and its store call —
because each is a small service growing feature by feature. The
Async User Register API is layered, because the same registration
rules are shared by the HTTP trigger and the queue trigger, and the
rule must not exist twice.

### The failure mode: shared rules drift

Slices fail the same way every time. Two features both validate an
email; one day the rule changes (plus-addressing, a new domain
blocklist) and only one slice is updated. Now the same input is
valid in one feature and invalid in another, and the bug report
reads like the system is lying.

The fix is not to abandon slices — it is to be deliberate about
what is shared:

- **Share the rule, not the layer.** A tiny shared module —
  `shared/validation.py`, one function `is_valid_email` — used by
  every slice. The rule lives once; the slices stay independent.
  This is exactly what `shared/models.py` does for the Azure
  Functions register API.
- **Share by extraction, not by anticipation.** Do not build the
  shared module on day one. Build the second slice, notice the
  duplicated rule, extract it then. Premature sharing is how a
  slice design quietly becomes a layered design with worse names.
- **Audit the drift.** A `grep` for the rule's keywords across
  slices once a month catches the copy that never got updated.
  Cheap, unglamorous, and it works.

### The decision rule

Start layered when the system has a core concept that many
features will share (users, orders, listings). Start sliced when
the system is a collection of features that happen to share a
deployable (a salon booking API, a set of admin tools). Either way,
write the choice down — one ADR, one paragraph, naming what would
make you change your mind. The wrong shape is survivable; the
undocumented shape is not, because the next person cannot tell a
deliberate choice from an accident.

### What I will add next in this folder

- 2026-11-27: 02 - AI Design — multi-agent patterns in depth
  (supervisor/workers vs peer agents, shared state).
- Later: a second pass on 03 - Security Design and 04 - Cloud
  Design — both covered once already; next time one topic each,
  in more depth.
