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

### What I will add next in this folder

- Part 2: data partitioning and cell-based architecture in detail.
- Part 3: game days — how to rehearse failure without causing one.
