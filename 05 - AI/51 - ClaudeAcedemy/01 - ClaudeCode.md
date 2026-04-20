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

## Getting Started with a New Project

When you first start Claude in a new project, run the `/init` command. This tells Claude to analyze your entire codebase and understand:

- The project's purpose and architecture
- Important commands and critical files
- Coding patterns and structure

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

## Using Screenshots for Precise Communication

One of the most effective ways to communicate with Claude is through screenshots. When you want to modify a specific part of your interface, taking a screenshot helps Claude understand exactly what you're referring to.

- **Paste a screenshot** into Claude using `Ctrl+V` (not `Cmd+V` on macOS)
- This keyboard shortcut is specifically designed for pasting screenshots into the chat interface
- Once pasted, you can ask Claude to make specific changes to that area of your application

---

## Planning Mode

For complex tasks that require extensive research across your codebase, enable Planning Mode. This makes Claude do thorough exploration before implementing changes.

**Enable:** Press `Shift + Tab` twice (or once if you're already auto-accepting edits)

In Planning Mode, Claude will:

- Read more files in your project
- Create a detailed implementation plan
- Show you exactly what it intends to do
- Wait for your approval before proceeding

This gives you the opportunity to review the plan and redirect Claude if it missed something important.

---

## Thinking Modes

Claude offers different levels of reasoning through "thinking" modes, allowing Claude to spend more time reasoning about complex problems before providing solutions.

| Mode | Description |
| --- | --- |
| "Think" | Basic reasoning |
| "Think more" | Extended reasoning |
| "Think a lot" | Comprehensive reasoning |
| "Think longer" | Extended time reasoning |
| "Ultrathink" | Maximum reasoning capability |

Each mode gives Claude progressively more tokens to work with, allowing for deeper analysis.

### When to Use Planning vs Thinking

| Feature | Best For |
| --- | --- |
| **Planning Mode** | Tasks requiring broad codebase understanding, multi-step implementations, changes affecting multiple files |
| **Thinking Mode** | Complex logic problems, debugging difficult issues, algorithmic challenges |

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

### Escape / Double-Tap Escape

- **Escape** — Cancel the current Claude response
- **Double-tap Escape** — Cancel and clear current input

### Conversation Control Best Practices

These techniques are particularly valuable during:

- Long-running conversations where context can become cluttered
- Task transitions where previous context might be distracting
- Situations where Claude repeatedly makes the same mistakes
- Complex projects where you need to maintain focus on specific components

Use `Escape`, double-tap `Escape`, `/compact`, and `/clear` strategically to keep Claude focused and productive.

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

**Example: Playwright MCP Server**

Playwright gives Claude the ability to control a web browser, opening up powerful possibilities for web development workflows.

Install:

```
claude mcp add playwright npx @playwright/mcp@latest
```

To pre-approve permissions, edit `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": ["mcp__playwright"],
    "deny": []
  }
}
```

Note the double underscores in `mcp__playwright`.

**Other MCP Servers to Explore:**

- Database interactions
- API testing and monitoring
- File system operations
- Cloud service integrations
- Development tool automation

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

Hooks are defined in Claude settings files. You can add them to:

- **Global** — `~/.claude/settings.json` (affects all projects)
- **Project** — `.claude/settings.json` (shared with team)
- **Project (not committed)** — `.claude/settings.local.json` (personal settings)

You can also use the `/hooks` command inside Claude Code.

**Practical Applications:**

- **Code formatting** — Automatically format files after Claude edits them
- **Testing** — Run tests automatically when files are changed
- **Access control** — Block Claude from reading or editing specific files
- **Code quality** — Run linters or type checkers and provide feedback to Claude
- **Logging** — Track what files Claude accesses or modifies
- **Validation** — Check naming conventions or coding standards

**Key insight:** `PreToolUse` hooks give you control over what Claude *can* do, while `PostToolUse` hooks let you enhance what Claude *has* done.

### 5. **Custom Commands with Arguments**

Custom commands can accept arguments using the `$ARGUMENTS` placeholder, making them flexible and reusable.

---

## GitHub Integration

### Setting Up

Run `/install-github-app` in Claude to walk through the setup process:

- Install the Claude Code app on GitHub
- Add your API key
- Automatically generate a pull request with the workflow files

The generated PR adds two GitHub Actions to your repository. Once merged, you'll have the workflow files in your `.github/workflows` directory.

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

| Feature | Command / Shortcut | Purpose |
| --- | --- | --- |
| Initialize Project | `/init` | Analyze codebase and auto-generate CLAUDE.md |
| Create Subagent | `/agents` | Set up a new specialized agent |
| Manage MCP | `/mcp` | View, add, or disable MCP servers |
| Add MCP Server | `claude mcp add <name> <cmd>` | Add an MCP server |
| Configure Hooks | `/hooks` | Set up deterministic automation |
| Compact Context | `/compact` | Free up context space |
| Clear Session | `/clear` | Start fresh with no memory |
| Check Context | `/context` | View context usage and breakdown |
| Planning Mode | `Shift + Tab` (×2) | Enable thorough exploration before implementation |
| Paste Screenshot | `Ctrl + V` | Paste a screenshot into the chat |
| Cancel Response | `Escape` | Cancel current Claude response |
| GitHub Setup | `/install-github-app` | Set up GitHub Actions integration |