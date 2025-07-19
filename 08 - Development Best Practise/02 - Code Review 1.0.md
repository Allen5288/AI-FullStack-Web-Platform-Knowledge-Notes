<aside>
Small and fast PRs + consistent review culture = fewer defects & a continuously growing team.
</aside>

# Code Review Guide (v1.0)

### 1 Goals & Principles

| Goal | Core Principle |
| --- | --- |
| **Continuous code‑health improvement** | Every merged PR must keep codebase health ≥ before merging. |
| **Knowledge sharing & mentoring** | Review is not just for finding bugs, but for sharing best practices and accumulating implicit knowledge. |
| **Fast, predictable delivery** | Small PRs + fast feedback, avoid large-scale rework and conflicts. |

---

### 2 Roles & Responsibilities

| Role | Responsibility |
| --- | --- |
| **Author** | Prepare PR (Motivation, Scope, Tests), respond to comments, split PR if necessary. |
| **Reviewer** (≥ 1) | Start review within 1 working day; ensure quality; use *blocking / suggestion / nit* comment categories. |
| **Lead / Tutor** | Second review for key design or architecture changes; arbitrate disputes; ensure PR is merged on time. |

---

### 3 Workflow

1. **Local checks** — `npm run type-check && npm test && npm run lint` must pass.
2. **Create PR**
    - **Title** example: `feat(ui): add dark‑mode toggle`
    - **Description** template:

        ```markdown
        ## Motivation
        Users can switch to Dark Mode to improve accessibility.
        
        ## Changes
        - Add <ThemeProvider> (React Context)
        - Add `theme` slice to Redux Toolkit
        - Update Tailwind config
        
        ## Tests
        - Unit: ThemeProvider toggles class
        - E2E: Cypress user flow
        
        ## Checklist
        - [x] No breaking API change
        - [x] Storybook updated
        
        ```

3. **Assign reviewers** — CODEOWNERS or manual @mention.
4. **Review** — By file / by commit / "Review in order"; use IDE diff for complex jumps.
5. **Discuss & iterate** — Author updates based on comments; Reviewer rechecks.
6. **Merge criteria** — ≥ 1 LGTM; CI passes; no blocking comments; Changelog updated if needed.
7. **Post‑merge** — Author monitors CI/CD and rollback; Reviewer gives encouragement.

---

### 4 Comment Levels

| Tag | Meaning |
| --- | --- |
| **blocking / must‑fix** | Logic bug, security vulnerability, breaking public API, CI failure. |
| **should‑fix / suggestion** | Maintainability/readability/performance improvement, can be turned into TODO. |
| **nit** | Micro style suggestion, does not block merging. |

---

### 5 Review Checklist

| Area | Key Points |
| --- | --- |
| **Design & Architecture** | Single responsibility, no circular dependencies; public API is clear; module directory follows conventions. |
| **Correctness** | Business logic, edge cases, error handling; no missing `any`. |
| **Readability & Style** | Naming conventions (Interface has no `I` prefix; PascalCase / camelCase); functions ≤ 40 lines; comments explain "why". |
| **Tests** | Unit & Integration cover new logic; `@ts-expect-error` tests type boundaries. |
| **Performance** | Hot paths avoid O(n²); correct use of `Promise.all`, `React.memo`, `useCallback`; resources lazy-loaded. |
| **Security** | Prevent XSS / SQLi; dependencies have no high-risk vulnerabilities; logs do not leak sensitive info. |
| **Maintainability** | Avoid repetition (DRY); split large components; side-effects placed in `services/`. |
| **DevOps** | Dockerfile / Terraform lint-clean; monitoring metrics exposed; Feature Flag default off. |
| **Docs** | README / Storybook updated; shared types in `types/`; API-extractor diff is non-breaking. |

---

### 6 Communication Etiquette

| Advocate | Avoid |
| --- | --- |
| Focus on code, do not judge personality: “Let’s extract this util.” | “This design is stupid.” |
| Use questions instead of commands: “Could we factor out the query hook?” |  |
| Cite standards/documentation as arguments |  |
| Submit in small steps, reply near comments, resolve promptly | Submit 5k LOC at once and urge merge |
| **Timely review** (≤ 24h; frozen branch ≤ 4h) | Delayed review causing conflicts |

---

### 7 Automation Gates

| Tool | Gate |
| --- | --- |
| **tsc --noEmit** | Zero type errors in strict mode. |
| **eslint + @typescript‑eslint** | Use `naming-convention`, deprecate old `interface-name-prefix`. |
| **prettier** | Unified style; do not accept pure formatting PRs. |
| **jest / vitest** | `--coverage --changedSince=origin/main` ≥ 80%. |
| **dependabot + npm audit** | Automatically block high-risk vulnerabilities. |

---

### 8 Reviewer Tips

1. **Top‑down** — Read PR description, architecture diagram, README first.
2. **Public API → Internals** — Look for design issues first.
3. **Commit‑by‑commit** — Avoid large diffs at once.
4. **Focus on delta** — Unchanged old code can be marked TODO, does not block.
5. **Local checkout** — `gh pr checkout <id>` and use IDE global search.
6. **Pair review** — For complex or security-critical code, review synchronously.

---

### 9 Continuous Improvement

- **Monthly retro** — Track average PR size, review time, rework rate; set goals for next month.
- **Automate blockers** — Turn common blocking comments into ESLint rules or CI checks.
- **Share knowledge** — Excellent PRs go into case library; problematic PRs get root-cause analysis.

---

### 10 How to Resolve Code Conflicts

1. **Prevent in advance**
    - Keep PRs small and frequently sync with `main`: `git fetch origin && git rebase origin/main`.
    - Use *Feature Flag* to isolate unfinished features, avoid long-term forks.
2. **Detect conflicts**
    - `CONFLICT` prompt during `git rebase` (team uses rebase to resolve conflicts).
    - GitHub shows “This branch is out‑of‑date with main”.
3. **Resolution steps**
    1. Check conflict files: `git status`.
    2. Open conflict files, locate `<<<<<<<`, `=======`, `>>>>>>>` markers.
    3. **Understand business logic** before modifying, avoid mechanical code deletion.
    4. Run `npm test && npm run type-check` to ensure correct fix.
    5. After `git add <files>`, continue: `git rebase --continue`.
    6. Push: `git push --force-with-lease` (avoid overwriting others’ work).
4. **Tool assistance**
    - **IDE GUI**: VS Code Merge Editor / WebStorm Merge Tool.
    - **CLI**: `git mergetool`; enable `git config rerere.enabled true` to let Git remember last conflict resolution.
    - **GitHub Online Resolver**: suitable for small Markdown/doc conflicts.
5. **Communication & collaboration**
    - For complex conflicts or key modules, @relevant authors in PR and explain solution.
    - If unsure about others’ code intent, keep their implementation, add FIXME/TODO and open issue to follow up.
6. **Best practices**
    - **Always use `git rebase`**, avoid extra merge commits and keep commit history linear.
    - Avoid using plain `git push --force`, always use `--force-with-lease`.
    - Delete branch immediately after merging, clean up long-stale branches.
    - Introduce *auto‑rebase* bot in CI to detect and warn about potential conflicts early.
