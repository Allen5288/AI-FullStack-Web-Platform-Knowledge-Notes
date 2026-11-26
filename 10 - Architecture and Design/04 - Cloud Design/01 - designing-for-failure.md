# 01 - Designing for failure: regions, availability zones and blast radius

## 2026-11-25 — Part 1: what breaks, who notices, and what it costs

Every cloud design is a bet about what will break. The principal
engineer's job is to make that bet explicit: name the failure, say
who notices, and price the protection before buying it.

### Start with RTO and RPO, not with services

- **RTO (recovery time objective):** how long can this be down?
  5 minutes and 4 hours are different systems, not different
  settings.
- **RPO (recovery point objective):** how much data can we afford
  to lose? Zero means synchronous replication; 15 minutes means
  async replication plus a documented gap.
- Ask the business, not the team: "the registration API is down
  for an hour on launch day" has a price. So does the multi-region
  setup that prevents it. The design is the trade between the two.

### Availability zones vs regions

- An **availability zone** is an isolated failure domain inside
  one region: separate power, cooling and network. An AZ outage is
  a building-scale event.
- A **region** is a whole geography. A region outage is rare and
  total for everything pinned to it.
- Multi-AZ protects against AZ loss and costs little — most managed
  services (DynamoDB, SQS, SNS, API Gateway) are multi-AZ by
  default, and you should check that yours are rather than assume.
- Only multi-region protects against region loss, and it costs a
  lot: replicated data, cross-region failover, and a conflict rule
  for writes that land in two places at once.

### Blast radius: make failures small

A failure should take a slice of the system, not the whole thing:

- **Bulkheads:** separate queues, connection pools and thread
  pools per workload, so a slow downstream cannot starve the rest.
  One SQS queue per job type, not one queue for everything.
- **Cells:** partition users or tenants into independent cells, so
  a bad deploy or a poison message hits one cell. The cost is
  operational complexity; the payoff is that "everything is down"
  becomes "one cell is down".
- **No single shared anything critical:** a single database, a
  single queue or a single third-party call on every request path
  is a single point of failure wearing a managed-service badge.

### Replication: sync vs async is a consistency decision

- **Synchronous replication** (write confirmed in two places):
  RPO zero, but every write pays cross-AZ latency and a slow
  replica slows the write path.
- **Asynchronous replication** (write confirmed locally, copied
  after): fast writes, but a failure loses the replication lag —
  typically seconds, sometimes minutes. DynamoDB global tables and
  S3 cross-region replication are async.
- There is no free choice here: CAP says you pick two of
  consistency, availability and partition tolerance, and in
  practice a partition is the one failure you cannot opt out of.
  Name which one you gave up, in the design doc.

### Failover patterns

- **Active-passive:** one region serves, one waits. Failover is a
  DNS or load-balancer flip plus a health check. The trap is data
  lag: the passive region is minutes behind, and the flip itself
  is the least-tested code path in the system. Rehearse it.
- **Active-active:** both regions serve. Reads are easy; writes
  need a rule — partition writes by tenant or region, or accept
  last-write-wins and its data loss. Most teams that think they
  need active-active actually need fast active-passive.
- **Health checks must mean something.** A load balancer that only
  checks TCP will keep routing to an app that answers TCP and
  fails every request. Check a real dependency (database read,
  queue depth) and fail the check when it is sick.

### The cost of resilience

Each extra nine costs roughly 10x the previous one:

| Target | What it usually takes |
|---|---|
| 99% (~7 h downtime/month) | Single AZ, backups, manual recovery |
| 99.9% (~43 min/month) | Multi-AZ managed services, alarms, runbooks |
| 99.99% (~4 min/month) | Multi-region, automated failover, rehearsed game days |
| 99.999% (~26 s/month) | Active-active, cell architecture, dedicated on-call |

Do not buy 99.99% for a system whose business RTO is 4 hours.
The money is better spent on the eval, the tests and the runbook
that make the 99.9% system recover in minutes instead of hours.

### Worked mapping

- **Async User Register API:** API Gateway, SNS, SQS and DynamoDB
  are multi-AZ by default, so one AZ dying does not stop
  registrations. The DLQ (2026-11-21) is the bulkhead: a poison
  message cannot block the queue. What is *not* covered: the whole
  stack is single-region, so a region outage still stops the API.
  Multi-region would need global tables plus a second API Gateway
  and a failover decision — a deliberate "not yet", not an oversight.
- **Medical AI Assistant:** the vector index (Pinecone / Azure AI
  Search) is pinned to one region, so a region outage takes search
  with it. The generation provider is swappable (provider
  abstraction, `05 - AI/03`), which is a different kind of
  resilience: if Groq is down, Azure answers. Same idea, cheaper
  than a second region.

### Decision record: staying single-region, for now

Record it, do not just assume it: "We stay single-region because
RTO is 4 hours, RPO is 15 minutes, and the cost of multi-region
exceeds the cost of a rare region outage for this workload.
Revisit when monthly active users pass 10,000 or a customer
contract demands it." A decision with a revisit trigger is a
design; a decision without one is drift.

## 2026-11-27 — Part 2: data partitioning and cell-based architecture — making failures small

Part 1 said a failure should take a slice of the system, not the
whole thing, and named bulkheads and cells. Today those two ideas
get their design: how to split the data so one tenant, one key or
one deploy cannot hurt everyone else.

### Partitioning: choose the key by the query, not by the entity

A partition key decides which physical slice of the store a record
lives on. Cosmos DB and DynamoDB both route by it, and both punish
the wrong choice the same way: queries that do not include the key
become cross-partition scans — slow, expensive, and throttled first.

- **Pick the key from the read pattern.** The Register API reads a
  user by `user_id` and lists nothing by email, so `user_id` is the
  partition key. If the app read users by email ten times a day,
  email would be a second index, not the partition key — the key
  serves the hot path.
- **The key must spread writes.** A key with one huge value — one
  tenant with 90% of the traffic, one "system" record everyone
  writes — is a hot partition: one physical slice takes all the
  writes while the others sit idle, and the store throttles the hot
  one. The fix is write sharding: append a synthetic suffix
  (`tenant#1 … tenant#10`) and spread that tenant's writes across
  ten keys, then fan out the read. Ugly, and cheaper than a hot
  partition at scale.
- **Time is a partition key too.** Logs, events and bookings split
  naturally by month: old partitions go cold (cheaper storage),
  retention is "drop the partition", and a bad day's data is one
  slice, not the whole table. The BookingApi's `data/bookings.json`
  is a single file today — the day it becomes a database, the
  partition is the date.

### Bulkheads first, cells when bulkheads are not enough

A bulkhead is a wall inside one system; a cell is a whole copy of
the system. They are the same idea at different scales:

| | Bulkhead | Cell |
|---|---|---|
| What it is | Separate queue / pool / table per workload | A full stack copy (API + queue + DB slice) serving a subset of tenants |
| What it stops | One slow downstream starving the rest | One bad deploy, one poison tenant, one region fault taking everyone down |
| Cost | Small — a config change | Large — N copies of everything to deploy, monitor and patch |

Start with bulkheads — one SQS queue per job type, one connection
pool per workload, the DLQ from 2026-11-21. Add cells when a single
tenant's failure can hurt the others: a tenant whose data is
corrupt, a tenant under attack, or a deploy that must not reach
everyone at once. A routing layer maps tenant → cell (usually a
small lookup table, itself replicated), and the cell is invisible
to the tenant: same API, same URLs, different backend.

### The costs of cells, stated plainly

Cells are not free, and the costs are operational, not code:

- **N of everything.** N dashboards, N alarms, N deploys, N
  database backups. A deploy that took one pipeline now takes a
  rollout across cells — which is the point (a bad deploy hits one
  cell), but the pipeline has to be built for it.
- **Cross-cell work gets hard.** A report across all tenants now
  reads N cells. If the business needs cross-tenant analytics,
  that is a separate pipeline that aggregates out of the cells —
  do not let reporting queries reach into every cell's live store.
- **Cell assignment is a decision with a migration.** Moving a
  tenant between cells means copying their data and flipping the
  router. Keep tenants small enough per cell that a move is a
  background copy, not a weekend migration.

The rule: do not build cells until one tenant can plausibly hurt
another. For a small system, bulkheads plus a single region plus a
documented "not yet" (Part 1's decision record) is the right call.

### Data residency: cells per region, for a legal reason

Some tenants' data must stay in a country. That is not a
performance decision — it is a cell decision: the tenant's cell
lives in the region the law requires, and the router never sends
their data elsewhere. Replication across regions for that tenant is
off the table by design, and the RPO/RTO from Part 1 is set per
cell, not per system.

### Worked mapping

- **Async User Register API:** users partition by `user_id` in
  Cosmos DB / DynamoDB — the read pattern is "one user by id", so
  the key is already right. The welcome topic is the bulkhead:
  a flood of welcome sends cannot block registrations, because
  they are different queues. Cells would come later: one cell per
  client if the API ever serves more than one business.
- **Medical AI Assistant:** the vector index is already partitioned
  by tenant — `tenant_id` is a filter on every search, which is a
  logical partition. The physical version is one index per tenant,
  which is a cell for the search layer: one tenant's bad documents
  cannot pollute another's retrieval. Same rule as the token design
  (Part 2 of the Security notes): the partition key comes from the
  token claim, never the request body.

### Decision record: staying un-celled, for now

"We stay on one cell because we have one tenant and one region,
and the cost of N deploys exceeds the cost of a rare whole-system
outage for this workload. Bulkheads (separate queues, DLQ, per-job
pools) carry the isolation for now. Revisit when a second tenant
arrives, or when one tenant's traffic passes 50% of the total."
A decision with a revisit trigger is a design; a decision without
one is drift — same rule as Part 1.

### What I will add next in this folder

- Part 3: game days — how to rehearse failure without causing one.
