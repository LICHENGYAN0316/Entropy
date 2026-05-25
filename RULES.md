# Project Rules
Rules that apply to every agent on every action. When in doubt, follow these literally.
---
## R1. Privacy is Sacred
- ❌ Do not introduce any code that sends user data over the network.
- ❌ Do not add analytics, telemetry, error reporting services (Sentry, LogRocket, etc.), or A/B testing tools.
- ❌ Do not add cookies, `localStorage` writes, or `IndexedDB` in the MVP phase.
- ❌ Do not propose features that would require a backend.
- ✅ Before adding any `fetch()`, `XMLHttpRequest`, `navigator.sendBeacon`, or `WebSocket` call, stop and flag it in PROGRESS.md. Wait for Pluto's explicit approval.
---
## R2. Restraint Over Features
- When in doubt, **remove**, don't add.
- No UI element gets added without a clear functional reason.
- No text label, tooltip, or onboarding hint without explicit approval.
- No animations purely for animation's sake. Every motion must serve the core aesthetic.
- If a feature is fun but not in REQUIREMENTS.md, it does not get built.
---
## R3. Minimal Dependencies
- The only "large" dependency permitted is **Three.js**.
- Any new npm package addition must:
  1. Be flagged in PROGRESS.md before installation
  2. Justify its size (bundle impact in KB gzipped)
  3. Have no native alternative within reasonable effort
- ❌ No utility libraries (lodash, ramda) — write the 3 lines you need.
- ❌ No CSS frameworks (Tailwind, Bootstrap). Hand-written CSS only.
- ❌ No state management libraries. Vanilla TS modules with explicit imports.
---
## R4. Code Style
- TypeScript strict mode is on. Do not disable.
- Prefer pure functions for non-rendering logic.
- Shader code (GLSL) goes in `.glsl` files, imported as strings via Vite's `?raw` import.
- File naming: `kebab-case.ts` for modules, `PascalCase.ts` for classes (if any).
- Maximum file length: 300 lines. Split if longer.
- No abbreviations in names except established ones (`ctx`, `gl`, `uv`, `rgb`).
---
## R5. Commit Discipline
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `perf:`, `refactor:`.
- One logical change per commit. Don't batch unrelated changes.
- Every commit must leave the project in a deployable state. Broken commits get amended or reset, not pushed.
---
## R6. Branching
- `main` — always deployable. Auto-deploys to GitHub Pages.
- Feature work happens on `feat/<short-name>` branches.
- PRs require Codex review before merge (Codex comments on the PR; Pluto reads and merges).
---
## R7. Performance Discipline
- Before adding a visual effect, ask: "does this hold 60fps on a 2020 MacBook and 30fps on iPhone 12?"
- Force calculations: always in the vertex shader, never on CPU per-frame.
- Texture sizes: power-of-two when possible, ≤ 2048×2048 unless justified.
- No `setInterval` for animation. Use `requestAnimationFrame` exclusively.
---
## R8. Out-of-Scope Defense
If a user-facing request (from Pluto or otherwise) asks for something on the "Out of Scope" list in REQUIREMENTS.md, the agent does NOT silently comply. The agent:
1. Quotes the relevant Out-of-Scope line
2. Asks Pluto to either explicitly override or confirm the request is being declined
3. Waits
This applies especially to requests like "just add a quick login" or "let's track unique visitors" — these may seem small but violate the core principles.
---
## R9. The README is a Promise
The `README.md` includes a "Privacy by Design" section that promises zero network requests after page load. **This promise must be technically true at all times.** Any code change that would break this promise also breaks the README and is rejected.
---
## R10. Aesthetic Hierarchy
When making a visual decision and the requirements are ambiguous, agents should optimize in this priority order:
1. **Restraint** — does removing this make it better?
2. **Cohesion** — does it match the rest of the piece?
3. **Craft** — is the detail level (e.g., the 0.5px border) consistent?
4. **Surprise** — does it create a small moment of delight?
5. **Information** — does it convey something the user needs to know?
Note that "information" is last. This is a deliberate inversion of normal product design. This is an art piece.
---
## R11. When Stuck
If an agent is genuinely stuck (ambiguous requirement, conflicting rules, unknown technical constraint):
1. Do NOT guess and proceed.
2. Document the question in PROGRESS.md under a `### Questions for Pluto` section.
3. Stop work on the affected component.
4. Continue on unrelated work if any exists, otherwise end session.
---
## R12. Respect the File System
- Agents do not delete files they did not create, unless explicitly instructed.
- Agents do not rename files without flagging it in PROGRESS.md.
- Agents do not commit `.env`, `node_modules`, build artifacts, or anything in `.gitignore`.
