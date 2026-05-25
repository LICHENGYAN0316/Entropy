# Agent Division of Labor
This project is developed with three AI coding agents working in parallel. Each agent has a defined primary domain. Agents stay in their lane unless explicitly instructed otherwise.
---
## Agent Profiles
### 🟦 Antigravity — Lead Developer
**Primary domain:** All frontend code, shader development, visual iteration.
**Owns:**
- `src/` — all TypeScript source code
- `src/shaders/` — all GLSL vertex and fragment shaders
- `index.html`, `style.css`
- Local development server, dev-time debugging
- Visual tuning of the particle system, easing curves, color, motion
**Why:** Antigravity's Manager Surface and integrated editor/terminal/browser loop is purpose-built for the rapid "edit code → reload browser → tweak visuals" cycle that shader and animation work demands.
**Workload:** ~65% of the project.
---
### 🟨 Cowork — Documentation, Assets, Communication
**Primary domain:** Everything that is not code.
**Owns:**
- `README.md` — public-facing project description
- `docs/` — design notes, aesthetic references, inspiration
- Social media / launch announcement copy (when ready)
- Organizing reference images, mood boards, screenshots
- Final QA of the deployed site from a user perspective (does it feel right?)
**Why:** Cowork runs on the desktop, has access to the local file system, and excels at non-code knowledge work. It's well-suited to drafting copy, organizing reference material, and reviewing the final experience.
**Workload:** ~20% of the project.
---
### 🟩 Codex — Infrastructure, Testing, Code Review
**Primary domain:** Everything that runs in the cloud or in CI.
**Owns:**
- `.github/workflows/` — GitHub Actions configuration
- `package.json`, build scripts, dependency management
- Pull request review (when Pluto opens a PR)
- Cross-browser compatibility testing
- Performance profiling and optimization suggestions
- Writing unit tests for non-visual utilities (color sampling math, image downscaling, HEIC fallback)
**Why:** Codex's strength is long-running tasks in cloud sandboxes and tight GitHub integration. This frees up the local machine and keeps the main editor responsive for visual work.
**Workload:** ~15% of the project.
---
## Decision Authority
When agents disagree or when a decision crosses domains:
| Decision type | Authority |
|---|---|
| Visual / aesthetic | Antigravity proposes, Pluto decides |
| Architectural | Antigravity proposes, Codex reviews, Pluto decides |
| Privacy / scope | **Pluto only.** Agents must not weaken privacy or expand scope without explicit approval. |
| Documentation tone | Cowork proposes, Pluto approves |
| Dependencies | Any agent proposes, Codex reviews for size/security, Pluto approves |
---
## Handoff Protocol
Agents do not share memory or context between sessions. The handoff mechanism is **files in the repo**.
### When starting a session, every agent reads (in order):
1. `REQUIREMENTS.md` — what we're building
2. `AGENTS.md` — this file, who does what
3. `RULES.md` — how to behave
4. `PROGRESS.md` — current state of the project (see below)
### When ending a session, the active agent writes:
- An update to `PROGRESS.md` describing:
  - What was just completed
  - What is in progress
  - What is blocked and why
  - What the next session should pick up
### `PROGRESS.md` format
```markdown
## [YYYY-MM-DD HH:MM] — [Agent name]
### Completed
- ...
### In progress
- ...
### Blocked
- ...
### Next up
- ...
```
This file is the **single source of truth for project state.** If it conflicts with an agent's memory, the file wins.
---
## Workflow Pattern
The recommended development loop:
```
1. Pluto reviews PROGRESS.md, decides next task
2. Pluto assigns to the appropriate agent based on domain
3. Agent reads context files, executes task
4. Agent updates PROGRESS.md before ending session
5. If code was written: Pluto pushes to GitHub
6. Codex reviews the PR, comments, suggests changes
7. Antigravity addresses review comments
8. Pluto merges, deploys, returns to step 1
```
Cowork is invoked outside this loop for documentation and asset work, which can happen in parallel with code work without conflict.

### Handoff reminder
At the end of every session, the active agent (or Cowork acting as coordinator) must tell Pluto:
> "下一步该交给 **[Agent name]**，任务是：[具体任务描述]"

This prevents Pluto from having to read PROGRESS.md to figure out who goes next. The reminder is mandatory — not optional.

### Quick routing guide
When Pluto is unsure who to assign:
| Task type | Assign to |
|---|---|
| Any code, shader, visual, animation | Antigravity |
| GitHub Actions, CI, package.json, tests | Codex |
| README, docs, copy, QA review | Cowork |
| PR review after Antigravity pushes | Codex |
| Addressing review comments | Antigravity |
| Final merge decision | Pluto |

---
## Skills Reference
These skill files live in `Skills/` and should be invoked at the moments described below. Read the relevant `SKILL.md` before starting the task it covers.

| Skill | Path | When to use |
|---|---|---|
| `writing-plans` | `Skills/superpowers-main/skills/writing-plans` | **Antigravity / Codex:** before touching any code — write the implementation plan first |
| `dispatching-parallel-agents` | `Skills/superpowers-main/skills/dispatching-parallel-agents` | **Any agent:** when 2+ independent tasks can run in parallel (e.g. Phase 1 scaffold + CI setup + README) |
| `verification-before-completion` | `Skills/superpowers-main/skills/verification-before-completion` | **Any agent:** before claiming a task is done — run verification commands, confirm output, then mark complete |
| `requesting-code-review` | `Skills/superpowers-main/skills/requesting-code-review` | **Antigravity / Codex:** before opening a PR or asking Pluto to merge |
| `receiving-code-review` | `Skills/superpowers-main/skills/receiving-code-review` | **Antigravity:** when Codex has commented on a PR — read before implementing changes |
| `systematic-debugging` | `Skills/superpowers-main/skills/systematic-debugging` | **Antigravity:** when a shader, animation, or render bug appears — diagnose before fixing |
| `finishing-a-development-branch` | `Skills/superpowers-main/skills/finishing-a-development-branch` | **Any agent:** at the end of each Phase before merging to `main` |
| `karpathy-guidelines` | `Skills/andrej-karpathy-skills-main/skills/karpathy-guidelines` | **All agents, always:** core behavioral rules — think before coding, simplicity first, surgical changes |

---
## Anti-Patterns
Things agents should NOT do:
- ❌ Make changes outside their primary domain without an explicit instruction from Pluto
- ❌ Add dependencies without flagging the addition in PROGRESS.md
- ❌ Skip writing to PROGRESS.md at session end
- ❌ Propose features listed in REQUIREMENTS.md as "Out of Scope"
- ❌ Suggest adding a backend, database, analytics, or any user identification
- ❌ Modify RULES.md or REQUIREMENTS.md unilaterally (propose changes in PROGRESS.md, wait for Pluto)
