# Task Plan: Phase 1 Vertical Slice (Upload, Extract, Render)

## Goal
Implement the upload button UI, browser-native pixel extraction, and render the static particle cloud in Three.js with custom GLSL shaders and slow auto-rotation.

## Current Phase
Completed (Bug Fix Phase 7)

## Phases

### Phase 1: Scaffold & Quality Tooling
- [x] Create basic configs (.gitignore, tsconfig.json, eslint.config.js, .prettierrc, vite.config.ts)
- [x] Create package.json with scripts and dependencies
- [x] Install dependencies and verify build/lint
- **Status:** complete

### Phase 2: App Entry & Skeleton Code
- [x] Create index.html, style.css, src/main.ts, src/particles.ts, src/interaction.ts, and src/shaders/README.md
- [x] Verify local dev server loads correctly
- **Status:** complete

### Phase 3: CI/CD Deployment
- [x] Create .github/workflows/deploy.yml
- [x] Verification on dev build and final status check
- **Status:** complete

### Phase 4: UI & Pixel Extraction
- [x] Create glassmorphic upload button in index.html and style.css
- [x] Implement browser-native canvas image processing and pixel sampling in src/particles.ts
- **Status:** complete

### Phase 5: Three.js Rendering Setup
- [x] Initialize Three.js WebGLRenderer, PerspectiveCamera, Scene, and Resize handler in src/main.ts
- [x] Set up auto-rotating container group in src/main.ts
- **Status:** complete

### Phase 6: Custom Shaders & Breathing Effect
- [x] Write vertex and fragment shaders in src/shaders/
- [x] Compile ShaderMaterial and render the particle cloud in Three.js
- [x] Add canvas double-click and long-press event listeners in src/interaction.ts to re-summon the upload button
- **Status:** complete

### Phase 7: Bug Fix - Large Image Freeze
- [x] Implement asynchronous ImageBitmap decoding off the main thread
- [x] Downscale bitmap to <= 1200px on the longest edge before drawing to offscreen canvas
- [x] Safely close all intermediate ImageBitmap allocations to avoid memory leaks
- **Status:** complete

## Key Questions
1. Is the deploy base path matching the repo `/Entropy/`? (Yes, configured in vite.config.ts)

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Vite with Raw import | To easily load .glsl files as strings |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| ERESOLVE unable to resolve dependency tree | 1 | Downgraded eslint to ^8.57.0 to match @typescript-eslint peer dependency rules |
| TS2307: Cannot find module './shaders/*.glsl?raw' | 1 | Created src/vite-env.d.ts to declare '*?raw' module type support |
