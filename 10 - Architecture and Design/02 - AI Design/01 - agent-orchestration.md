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

### What I will add next in this file

- 2026-11-24: multi-agent patterns in depth — supervisor/workers
  vs peer agents, and how they share state without stepping on
  each other.
- Later: evaluation for agents — tracing a run back to a golden
  set, and scoring plans, not just final answers.
