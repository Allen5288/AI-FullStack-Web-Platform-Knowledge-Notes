# Claude Cowork — Complete Guide

## What is Cowork?

Cowork is a mode inside Claude Desktop for **multi-step, long-running work** that produces real files and interacts with your existing tools. It sits alongside Chat and Code in the mode selector at the top of the app.

---

## Core Capabilities

### Connectors
Reach into your existing tools — email, messaging, shared drives — so context flows in automatically.

### File Operations
Read, edit, and create real files on your drive: presentations, spreadsheets, documents. Output is saved directly to your drive.

### Plugins
Domain expertise built into Cowork. Each plugin bundles knowledge and workflows for a specific function (e.g. sales, ops, marketing), so Claude approaches your task the way a specialist would.

### Scheduled Tasks
Run any Cowork task automatically on a cadence — hourly, daily, weekly, or custom. Use `/schedule` to set one up.

### Subagents
Parallelise work. When a task has many independent pieces, Cowork works them at the same time.

### Local Computation
Run code on files in place and write results back. No upload/re-download cycle.

---

## Projects

Each Cowork task starts fresh — no conversation memory carries over. **Projects** are how context persists.

A project is a named workspace backed by a real folder on your machine, with instructions and memory that carry into every task you start inside it.

### How to create a project
- Start from scratch
- Import from a Chat project (files + instructions come over; sync is one-way)
- Wrap an existing folder on your machine

### Tips
- Claude reads everything in your project folder. Place running notes, glossaries, or evolving context there.
- "Add what we just covered to my notes file" works — Claude can update files in the folder.
- The **Instructions panel** is yours to set and is separate from files.

> Full setup guide: [Organize your tasks with Projects in Cowork](https://support.claude.com/en/articles/14116274-organize-your-tasks-with-projects-in-cowork)

---

## Global Instructions

For preferences that don't change between projects — your role, default output formats, standing rules like "ask before deleting."

**Location:** Settings → Cowork → Global Instructions

These apply to every Cowork task, inside a project or not.

---

## Plugins (Deep Dive)

A plugin is a bundle of several pieces packaged together for a role or domain:

| Component | What it does | Example |
|---|---|---|
| **Skills** | Instructions for handling specific workflows. Invoked automatically or via `/` commands. | `/prep-call`, `/weekly-report`, how to structure a deal brief |
| **Connectors** | Reach the systems where work happens. | Your CRM, docs, messaging |
| **Subagents** | Parallelise specialised work. | One agent per account in a book-wide review |

### About Skills
- Skills are the **core building block** inside plugins.
- A skill is a markdown file that teaches Claude how to handle one thing: a workflow, a format, a process.
- Skills aren't specific to Cowork — they work across Claude's surfaces (chat, Claude Code, etc.).
- A plugin is the Cowork-specific way of **bundling skills with the connectors** they need.

---

## File Output — Key Takeaways

- **Real files.** Presentations with editable charts. Spreadsheets with working formulas. Documents with track changes.
- **Native output.** A chart in a Cowork-made deck is an editable chart — click in, adjust data, change formatting.
- **Templates compound.** Once you create a brand-guidelines skill, every file Cowork produces can reference it.

---

## Usage Tips

Cowork uses more of your allocation than chat — multi-step work is more compute-intensive.

| Habit | Why it helps |
|---|---|
| **Batch related work** | Starting a fresh session has overhead. Do related tasks in one session. |
| **Use chat when it fits** | If a task doesn't need your files, connected tools, or a real output file, chat is faster and cheaper. |
| **Monitor usage** | Check Cowork's settings periodically to see where you stand. |

### The key question
> "Does this need my files, tools, or a real output?" If no → use Chat. If yes → use Cowork.