# Claude Code Guide

## Overview

Claude Code is an agentic coding tool that reads your codebase, edits files, runs commands, and connects to external tools to help you ship faster. Available in your terminal, VS Code, JetBrains, and the Claude Desktop app.

---

## Installation

### macOS, Linux, or WSL

**Using curl (recommended with auto-updates):**

```
curl -fsSL https://install.claude.sh | bash
```

**Using Homebrew (no auto-updates):**

```
brew install claude
```

### Windows

**Using PowerShell:**

```
Invoke-RestMethod command
```

**Using CMD:**

```
curl command
```

**Using winget (no auto-updates):**

```
winget install claude
```

### After Installation

```
claude
```

If the command doesn't work, restart your terminal. Navigate to your project directory and run `claude` to start.

---

## Core Workflow: EPCC

### 1. **Explore**

Gives Claude the relevant context needed for your project

### 2. **Plan**

Creates a plan of action that Claude uses to measure success

### 3. **Code**

Back and forth collaboration between you and Claude before settling on the final outcome

### 4. **Commit**

Review and push your code to start on the next feature

---

## Context Management

### Manual Compaction

```
/compact
```

Frees up context space while keeping memory of previous work

### Clear Session

```
/clear
```

Completely start from scratch with no memory of previous session

### Check Context State

```
/context
```

High-level overview of context size, categories, and visual breakdown

### CLAUDE.md File

- Provides context for Claude Code sessions
- Should include: stack, preferences, commands
- **Start without one** — let Claude generate based on actual needs
- Run `/init` to have Claude auto-generate one

---

## Customization Options

### 1. **Subagents**

Specialized agents that run independently to handle specific tasks and return results to your main context.

**Key Features:**

- Defined in Markdown files with YAML frontmatter
- **Persistent memory** — retain memory across conversations
- **Skill preloading** — add skills using the `skill` key
- Useful for background heavy lifting
- Create with: `/agents` → "Create new agent"

**Setup Steps:**

1. Run `/agents`
2. Select "Create new agent"
3. Choose scope, purpose, tools, and color
4. Claude generates name, description, and prompt

### 2. **Skills**

Reusable sets of instructions and best practices for specific tasks or workflows.

**Use Cases:**

- Writing skills files
- Standardizing approaches
- Encapsulating best practices

### 3. **MCP (Model Context Protocol)**

Open standard that lets Claude Code connect to external tools and data sources.

**Why It Matters:**

- Bridges gap between codebase and external context
- Access information in databases, productivity apps, public repositories
- Claude automatically understands when to use these tools

**Types of MCP Servers:**

- **HTTP servers** — Remote services hosted by providers, connect over network
- **Stdio servers** — Local processes running on your machine

**Setup:**

```
claude mcp add
```

**Management:**

```
/mcp
```

View connected servers, check status, disable servers you don't need

**Scoping MCP Servers:**

1. **Local** — Only in current project, just for you
2. **User** — Available across all your projects
3. **Project** — Uses `.mcp.json` file checked into version control for team consistency

### 4. **Hooks**

Deterministic commands that run at specific points in Claude Code's lifecycle — they **always run**.

**Why Use Hooks:**

- Guarantee automation (unlike prompts which are probabilistic)
- Auto-formatting after every file edit
- Compliance logging
- Blocking dangerous operations
- Sending notifications

**Available Events:**

- `PreToolUse` — runs before a tool call
- `PostToolUse` — runs after a tool call completes
- `UserPromptSubmit` — runs when you submit a prompt
- `Stop` — runs when Claude finishes responding
- `Notification` — runs when Claude sends a notification

**Configuration:**

- Use `/hooks` command inside Claude Code
- Or edit `settings.json` directly
- Check into repo for team consistency

**Common Use Cases:**

- Auto-formatting with Prettier after edits
- Logging all executed commands
- Blocking modifications to production files
- Sending task completion notifications

---

## Pro Tips

### Code Review Workflow

Use a subagent for unbiased code review before pushing:

```
/commit-push-pr
```

Handles full commit-to-PR flow in one step

### Resume Work on PR

```
--from-pr
```

Resume work on a PR later without losing context

### Context Management Best Practice

Keep your context window clean by:

- Using subagents for heavy lifting
- Disabling MCP servers when not actively using them
- Using `/compact` to free up space

### Key Principle

**If something needs to happen every time without fail, don't put it in a prompt. Put it in a hook.**

---

## Quick Reference

| Feature | Command | Purpose |
| --- | --- | --- |
| Create Subagent | `/agents` | Set up a new specialized agent |
| Manage MCP | `/mcp` | View, add, or disable MCP servers |
| Configure Hooks | `/hooks` | Set up deterministic automation |
| Initialize CLAUDE.md | `/init` | Auto-generate project configuration |
| Compact Context | `/compact` | Free up context space |
| Clear Session | `/clear` | Start fresh with no memory |
| Check Context | `/context` | View context usage and breakdown |