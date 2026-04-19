# Claude Platform — Features & Best Practices

---

## Projects

### What are Projects?

Projects are **self-contained workspaces** with their own memory, chat histories, knowledge bases, and customized instructions. Think of them as dedicated environments for specific work streams.

They're ideal for storing knowledge Claude should reference, organizing related chats around a topic, and collaborating with teammates who need shared context.

### When to use Projects

Create a project when your workflow involves:

- Reference materials you'll use repeatedly (meeting notes, reports, survey results, historical data)
- Consistent requirements for how Claude should respond (tone, format, templates)
- Team collaboration where multiple people need the same foundation

### Best Practices

| Practice | Detail |
|---|---|
| **Start focused, then expand** | Begin with a specific use case rather than one project for everything. |
| **Keep knowledge current** | Outdated documents lead to outdated responses. Review periodically. |
| **Write clear instructions** | Be specific — vague instructions lead to inconsistent results. |
| **Name files descriptively** | Use `Q4-2025-Sales-Report.pdf`, not `report.pdf`. Claude uses filenames to understand relationships. |
| **Reference documents by name** | "Based on our Q3 report, what were the top concerns?" helps Claude focus its search. |

### Scaling

When your knowledge base approaches context limits, Claude seamlessly enables **Retrieval Augmented Generation (RAG)** mode — expanding capacity by up to 10x while maintaining response quality.

---

## Artifacts

### What are Artifacts?

Artifacts are **standalone, interactive outputs** that Claude creates in a dedicated window alongside your conversation. Instead of a long block of text in the chat, you see content rendered and ready to use.

Claude automatically creates an artifact when content is:

- Significant and self-contained (typically 15+ lines)
- Something you'll likely want to edit, iterate on, or reuse
- Complex enough to stand on its own without surrounding conversation

### Artifact Types

| Type | Use Case |
|---|---|
| **Documents** (Markdown, Word, PDF, PowerPoint, Excel) | Reports, meeting notes, project plans, blog posts |
| **Code snippets** | Working code in any language — Python, JavaScript, C++, etc. |
| **HTML pages** | Landing pages, forms, interactive demos, quick prototypes |
| **SVG images** | Logos, icons, illustrations, vector graphics |
| **Mermaid diagrams** | Flowcharts, sequence diagrams, Gantt charts, org charts |
| **React components** | Interactive UI — calculators, dashboards, games, data visualizations |

### Sharing & Publishing

- **Copy / Download** — Use buttons in the lower-right corner of the artifact window.
- **Share within your org** (Team & Enterprise) — Requires team authentication to access.
- **Publish publicly** (Free, Pro, Max) — Anyone with the link can view and interact. Only the selected version becomes public; your chat stays private. Others can "remix" it in their own conversation. Not indexed by search engines.

### Tips for Better Artifacts

- **Be specific.** "Build a monthly budget tracker with expense categories, a pie chart, and over-budget warnings" beats "build a budget tracker."
- **Describe the end user.** "For new employees" yields different results than "for the engineering team."
- **Iterate incrementally.** One feature or change at a time makes it easier to catch issues.
- **Request when needed.** If Claude responds in chat instead of creating an artifact, just say "Please create that as an artifact."

---

## Skills

### What are Skills?

Skills are folders of instructions, scripts, and resources that Claude loads dynamically to handle specialized tasks. Think of them as **expertise packages** that teach Claude how to complete specific tasks in a repeatable way.

You've already seen Skills at work if you've used Claude to create Excel spreadsheets, PowerPoint presentations, Word documents, or PDFs.

### Types of Skills

| Type | Description |
|---|---|
| **Anthropic Skills** | Built-in, maintained by Anthropic. Available to all paid users. Invoked automatically when relevant. |
| **Custom Skills** | Created by you or your org for specialized workflows — brand guidelines for presentations, meeting note formats, data analysis workflows, etc. |

### How to Enable

1. Go to **Settings → Capabilities**
2. Toggle on **Code execution and file creation**
3. Scroll to **Skills** section and toggle individual skills on/off

> **Enterprise:** Owners must enable both Code execution and Skills in Admin settings first.
> **Team:** Enabled by default at the org level.

---

## Connectors

### What are Connectors?

Connectors give Claude access to the same tools, data, and context you use every day. Instead of starting every conversation from scratch, Claude works directly with your actual information.

Depending on permissions, Claude can search files, retrieve documents, analyse data, create content, update records, and execute tasks across connected apps.

### How Connectors Work

Powered by the **Model Context Protocol (MCP)** — an open standard like USB-C for AI, allowing Claude to connect to many applications through a single, consistent interface.

### Two Types

| Type | Description | Examples |
|---|---|---|
| **Web connectors** | Link Claude to cloud services | Google Drive, Notion, Slack, Asana |
| **Desktop extensions** | Run locally via Claude Desktop | Local files, native applications |

---

## Enterprise Search

A dedicated **"Ask {Your Org Name}"** option in the sidebar, designed for finding and synthesizing knowledge across your company's tools and data sources.

Think of it as a **pre-built Project for your entire organization** — your company's knowledge base is already loaded.

### Setup

**Admins (Owners):**
1. Click "Ask Your Org" in the sidebar → "Set up for your org"
2. Connect tools for Documents (Google Drive / SharePoint) and Chat (Slack / Teams). Email is optional.
3. Add additional tools as needed
4. Customize the project name and add a description

**Users:**
1. Click the project in your sidebar
2. Follow onboarding to connect and authenticate with each service
3. Start asking questions

> The more connectors you enable, the more comprehensive your results.

---

## Research

- Claude operates **agentically** — conducting multiple searches that build on each other, exploring different angles automatically.
- Most reports complete in **5–15 minutes** (complex ones up to 45 min).
- **Extended thinking** is automatically enabled, letting Claude plan its approach and break complex requests into pieces.
- **Citations** are included for easy verification.

---

## Claude Tools — Quick Reference

| Tool | Best For | Where It Runs |
|---|---|---|
| **Claude.ai** | General tasks, research, writing, analysis, file creation | Web, desktop, mobile |
| **Claude Code** | Software development, codebase navigation, git workflows | Terminal, IDE, browser |
| **Claude Cowork** | Complex multi-step tasks: briefs, docs, file org, data analysis | Desktop (+ mobile via Dispatch) |
| **Claude in Slack** | Team collaboration, meeting prep, quick answers in context | Slack workspace |
| **Claude for Excel** | Spreadsheet analysis, financial modeling, formula debugging | Excel sidebar |
| **Claude for PowerPoint** | Slide creation, presentation editing, formatting & design | PowerPoint sidebar |
| **Claude for Chrome** | Web research, email management, browser automation | Chrome sidebar |