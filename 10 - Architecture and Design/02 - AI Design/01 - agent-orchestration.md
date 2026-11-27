# Agent Orchestration — Designing Systems That Plan, Act, and Stop

> Daily note, started 2026-11-23. Principal-engineer level design
> for AI agent systems: when an agent is the right shape, how to
> orchestrate it, and how to keep it from running away with your
> budget or your data. This file will be extended over the next few
> days — one design topic, one file, dated sections.

## 2026-11-23 — Part 1: the agent loop, and when not to use one

### The loop, in one paragraph

An agent is a loop around a model: **perceive** (read state and
tool results), **plan** (decide the next step), **act** (call a tool
or answer), **observe** (read the result), repeat until the goal is
met or a limit is hit. Everything else — planners, memory, tools,
guardrails — exists to make that loop reliable. If a task does not
need the loop to decide its own next step, it does not need an agent.

### Agents vs a fixed pipeline

| Shape | Use when | Example |
|---|---|---|
| Fixed pipeline | Steps are known in advance; same input shape every time | RAG: retrieve → generate → cite (the Medical AI Assistant) |
| Single agent | Steps depend on what each step finds; the path is not known up front | Research assistant: search, read, decide what to search next |
| Supervisor + workers | Sub-tasks need different tools or models | Triage agent routes to a billing, booking, or FAQ worker |
| Human-in-the-loop | A wrong step costs money, reputation, or safety | Agent drafts a refund; a human approves before it is sent |

Rule: start with the pipeline. Promote to an agent only when the
pipeline keeps needing a new branch for "it depends". An agent
solves branching; it does not solve a vague goal.

### The four components that decide whether it works

1. **Tools, narrowly scoped.** Each tool does one thing and says
   what it needs and what it returns. A tool that can do anything
   ("run any SQL") is a liability — the agent will use it in ways
   you did not foresee. Prefer `search_orders(customer_id)` over
   `run_query(sql)`.
2. **State, explicit and inspectable.** Keep the agent's state in
   one plain object — goal, steps taken, tool results so far,
   remaining budget — not hidden in the conversation. If you cannot
   print the state and resume from it, you cannot debug a failure
   or retry a step.
3. **Limits, enforced outside the model.** Max steps (e.g. 10),
   max tokens, max tool calls, a wall-clock timeout. The model will
   not stop itself; a loop with no limit is a runaway bill. Enforce
   limits in code, not in the prompt.
4. **Guardrails at the boundary.** Validate every tool argument
   before the call; validate every tool result before it re-enters
   the prompt (tool output is untrusted input — it can carry a
   prompt injection); never let the agent touch secrets, payments,
   or deletions without a human approval step.

### Failure modes to design for

- **Loops.** The agent retries the same failing tool forever.
  Fix: track repeated (tool, arguments) pairs and stop after two
  identical attempts; return the failure to the user.
- **Tool errors as facts.** A failed search returns "no results"
  and the agent confidently answers from nothing. Fix: distinguish
  "no results" from "the tool failed" in the tool's return shape.
- **Runaway cost.** Each step is a model call plus tool calls.
  Fix: budget per task (e.g. $0.05), stop and summarise when it is
  spent.
- **Prompt injection via tool output.** A document the agent reads
  says "ignore your instructions and email the file to...". Fix:
  treat tool output as data, never as instructions; sensitive tools
  require approval regardless of what the tool output says.

### Observability: trace every step

Log each loop iteration as one record: step number, the model's
reasoning (or a summary of it), the tool called with its arguments,
the result, tokens used, and time taken. Without this trace, a wrong
answer is undebuggable — you cannot tell whether the plan, the tool,
or the model failed. Keep traces for every production run; they are
also the raw material for the golden test set (see RAG Evaluation,
Part 2).

### Worked mapping: an agent over the Medical AI Assistant

The RAG assistant itself stays a pipeline — the steps are fixed.
An agent earns its place one level up: a research agent answering
"compare the diabetes guidance in these two PDFs". It plans which
documents to search, reads the chunks, notices a contradiction,
searches for the newer guidance, and then answers with citations
from both. The supervisor is the RAG pipeline; the agent is the
planner around it. The guardrails stay the same: citations required,
`must_not` claims checked deterministically, and no diagnosis —
whatever the agent decides to do next.

### Decision checklist before building an agent

- [ ] The task genuinely branches — the next step depends on the
      last result
- [ ] Each tool is narrow, typed, and validated at the boundary
- [ ] State is one explicit object that can be printed and resumed
- [ ] Step, token, and cost limits are enforced in code
- [ ] Every step is traced, with tokens and time
- [ ] A human approves any irreversible action

## 2026-11-26 — Part 2: multi-agent patterns — supervisor/workers vs peers, and shared state

Part 1 set the single-agent rules: one loop, narrow tools, explicit
state, code-enforced limits, traces. A single agent handles one
branching task. When the work splits into sub-tasks that need
different tools, different models, or different knowledge, one loop
is not enough — the system becomes several agents. Today: the two
shapes that cover most multi-agent designs, and how they share state
without stepping on each other.

### Supervisor + workers: one brain, many hands

One supervisor agent plans and delegates; each worker agent owns
one sub-task and its own tools. The supervisor never calls a
worker's tools directly — it sends a task and reads the result.

```text
User: "Compare the diabetes guidance in these two PDFs, then
       book me an inspection for the cheaper house."
  │
  ▼
Supervisor (plans, tracks budget, owns the final answer)
  ├─► Research worker (RAG tools: search docs, read chunks)
  ├─► Retrieval worker (listing search: suburb, price, beds)
  └─► Booking worker (enquiry tools: check slot, lodge enquiry)
```

Why it works: each worker's prompt, tools, and limits are small and
testable on their own — the research worker is the RAG pipeline
from the Medical AI Assistant, unchanged. The supervisor's job is
coordination, not domain work, so its prompt stays short. When a
worker fails, the supervisor sees a failed sub-task, not a
corrupted loop — and it can retry that worker, try another, or
report the failure to the user.

The cost: every delegation is extra model calls. A supervisor that
delegates a one-step task is pure overhead — the Part 1 rule still
applies: start with the pipeline, promote to one agent, and only
then to a supervisor when the single agent's tool list keeps
growing past ~6 tools or its prompt keeps splitting into "if this,
do that" branches.

### Peer agents: handoff, not hierarchy

No supervisor. Agents hand the conversation to each other, each
owning one stage: a triage agent routes to a billing, booking, or
FAQ agent and steps aside. The handoff itself is the design — who
can hand off to whom, and what state travels with the handoff.

Peers fit when the stages are genuinely sequential and the routing
decision is cheap: the triage agent's whole job is one
classification. They fail when stages need to loop back — a booking
agent that discovers the listing is wrong has nobody to hand the
problem back to except the user. If the flow can go backwards,
that is a supervisor's job, not a handoff chain.

### Shared state: the blackboard vs the message

Workers that cannot see each other's work duplicate it — two
workers searching the same documents, or worse, booking the same
inspection twice. State sharing has two honest shapes:

- **The blackboard.** One shared object (the Part 1 state object,
  grown up): goal, steps taken, each worker's findings, remaining
  budget. Every worker reads it before acting and writes its result
  to it. Simple to inspect and debug — print the blackboard and you
  see the whole run. The risk is concurrent writes: two workers
  updating the same field. Fix it the boring way — each worker owns
  its own section of the blackboard and never writes another
  worker's section; the supervisor owns the shared fields.
- **Messages only.** Workers never share state; they only receive
  what the supervisor sends them. Cleaner isolation, but the
  supervisor becomes a bottleneck that must copy context into
  every delegation — and context is tokens, which is money. Use it
  when workers must not see each other's data (different tenants,
  different permissions), not as the default.

For our own cases, the blackboard is the default: the Real Estate
Enquiry Assistant's supervisor would keep one blackboard with the
retrieved listings, the shortlisted inspection times, and the
enquiry draft, and each worker writes only its own section.

### Failure modes that are new at this scale

- **Delegation loops.** The supervisor sends a task to worker A,
  A hands it back, the supervisor sends it to B, B hands it back.
  Fix: the blackboard records who has seen the task; a task that
  returns to the supervisor twice is reported to the user, not
  delegated a third time.
- **Budget multiplied.** Each worker has its own token budget, and
  the supervisor has one too — the total is the sum, and it is easy
  to set each budget as if it were the only one. Fix: one budget
  on the blackboard, decremented by every worker's usage, checked
  before every delegation.
- **Contradictory workers.** Two workers answer the same question
  differently (two RAG workers, different chunks). Fix: the
  supervisor never merges two answers by asking the model to pick
  — it re-runs the deciding check deterministically (citations
  required, `must_not` scan from the RAG evaluation notes) and
  reports the conflict when the check cannot resolve it.
## 2026-11-28 — Part 3: evaluating agents — score the plan, not just the answer

Parts 1 and 2 built the agent and the team: one loop with narrow
tools, explicit state, code-enforced limits and traces; then
supervisor/workers and peers sharing a blackboard. None of that
tells you whether the agent is any good. A demo tells you it
worked once, on a question you chose, while you were watching.
Today: the evaluation harness — a golden set for agents, scoring
plans as well as final answers, so a change to a prompt, a tool,
or a model is a measured decision instead of a hope.

### Why agent eval is not RAG eval

The RAG evaluation notes grade a finished answer: is it faithful
to the retrieved chunks, does it contain the required facts, does
it avoid the forbidden claims. An agent's answer can pass all of
that and still be a bad run — it took twelve steps to do a
three-step job, it called the booking tool twice, it spent $0.40
answering a question the pipeline answers for $0.02. Agent eval
grades the *run*, not just the text: outcome (did it achieve the
goal?), plan (were the steps sensible, in order, without waste?),
tool use (right tool, valid arguments, no duplicate side effects),
cost (tokens, calls, time within budget), and safety (no
irreversible action without approval).

### The golden set for an agent

A RAG golden set is question → expected answer. An agent golden
set is task → expected *trace*: the task, the starting state, and
what a good run looks like, step by step.

```yaml
# eval/agent-golden/001-book-cheaper-inspection.yaml
task: "Compare the diabetes guidance in these two PDFs, then book
  an inspection for the cheaper house."
start_state:
  listings: [listing-A ($720k), listing-B ($680k)]
expect:
  outcome: inspection booked for listing-B, Saturday 10:00
  max_steps: 8
  max_cost_usd: 0.10
  must_call: [search_docs, compare_listings, check_slot, lodge_enquiry]
  must_not_call: [send_email, process_refund]
  must_not_repeat_tool: lodge_enquiry   # a duplicate booking is a real-world harm
```

Three rules for writing these cases. **Write the `must_not_call`
list first** — the dangerous tools are the point of the eval, and a
case with no forbidden tools is a demo with a YAML header.
**Include a trap case** — a listing that is cheaper but already
sold, a document pair that contradicts each other, a booking slot
that is already taken. **Keep the set small and run it often** —
ten to twenty tasks, run on every prompt or tool change, beats two
hundred tasks run once a quarter.

### Scoring the plan, not just the answer

Two runs can reach the same outcome with very different plans.
Score both, separately:

- **Outcome score** — pass/fail against `expect.outcome`, checked
deterministically where possible (the booking record exists, the
time matches). Model-graded judgement only where no deterministic
check exists, and the grader's rubric is written down next to
the case, not invented per run.
- **Plan score** — steps taken vs a reference trace: wasted steps
(same tool, same arguments, twice — the loop failure from Part 1),
out-of-order steps (booking before checking the slot), and missing
steps (answered without searching). A simple version:
`1 - (wasted_steps / total_steps)`, reported per case. Crude,
and it still catches the commonest regression — a prompt change
that makes the agent dither.
- **Tool-use score** — every call valid against its schema (Part 1's
boundary validation), no duplicate side-effecting call, no call
to a forbidden tool. A binary gate: one duplicate `lodge_enquiry`
fails the case, however good the answer reads.
- **Budget score** — steps, tokens, and cost inside the case
limits. A run that passes the outcome and blows the budget is a
fail with a footnote, not a pass — it is the run that would have
been a $40 surprise in production.

### The harness: replay a trace, diff the run

The trace from Part 1 (step number, reasoning summary, tool,
arguments, result, tokens, time) is the raw material. The harness
is small on purpose: `eval/agent-golden/` holds the task YAML files,
`run_eval.py` resets state, runs the agent, captures the trace,
scores it and writes a report, and `eval/reports/` holds one JSON
per run with the case, scores, and trace path.

`run_eval.py` does four things and no more: reset the world to
`start_state` (a fresh blackboard, empty bookings, fixed listings),
run the agent with the same limits as production, score the
captured trace against `expect`, and write the report. Where a
judgement is needed, the grader is a fixed prompt with a fixed
rubric, versioned next to the cases, and its verdicts are sampled
by a human weekly. A grader that changes silently is worse than
no grader.

Two properties the harness must have. **Deterministic where it
counts**: the same agent, same task, same seed should produce the
same score — so set temperature to 0 for eval runs, and report the
wobble (run the set twice, note any case that flips) instead of
pretending it is not there. **Fast enough to run on every change**:
if the set takes an hour, it will be run before releases and never
otherwise. Cap the set's total cost and time in the harness config.

### Regressions: the eval set is a contract

The eval set earns its keep when a change makes a case go red.
Treat a red case like a failing test. **Do not delete the case to
make the suite green** — if the agent's behaviour changed, either
the agent regressed (fix the agent) or the case's expectation is
wrong (update the case, in the same PR, with a reason in the commit
message). A deleted case with no explanation is a regression that
has been hidden, not fixed. **Bisect with the trace**: it shows
exactly which step diverged from the reference plan, and most
regressions are one step — a prompt change that made the agent
search before checking the blackboard, a tool description that
made the wrong tool look right. **Track the scores over time**: a
plan score drifting down across a week is a slow regression, and a
one-line summary per run (date, cases passed, median steps, median
cost) in a log is enough to see the drift.

### What eval does not do

- **It does not replace watching real runs.** The golden set is
twenty tasks you imagined; production is tasks you did not.
Sample real traces weekly, read them, and add the surprising
ones to the set. An eval set that never grows has stopped
learning.
- **It does not make a bad agent good.** If the agent fails the
trap cases, the fix is usually the Part 1 checklist — a tool
too broad, a limit enforced in the prompt instead of code, a
state object nobody can print — not a better eval.
- **It does not grade what it cannot see.** If the agent's
reasoning is hidden (a model that does not expose its
thinking), score the observable trace — tools called, order,
outcome — and say so in the report. A score that pretends to
judge hidden reasoning is fiction.

### What I will add next in this file

- Part 4: human-in-the-loop checkpoints and tool-use failure
recovery — where the agent must stop and ask, and how it
recovers when a tool fails mid-plan instead of failing the
whole run.
