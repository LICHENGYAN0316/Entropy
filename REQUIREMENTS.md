# Project Requirements
## Overview
A single-page web application that transforms a user-uploaded photo into a floating 3D particle sculpture. The sculpture slowly rotates in space. When the user moves their cursor (desktop) or swipes their finger (mobile) across the canvas, the particles scatter like sand in a violent wind, then gracefully reassemble in slow motion with elegant damping.
The project is an art installation, not a product. It prioritizes aesthetic restraint, privacy, and zero-friction sharing over feature breadth.
---
## Core Principles
These are non-negotiable. Every design and implementation decision must respect them.
1. **No backend.** The entire application is a static site. No server, no API, no database.
2. **No accounts.** No login, no sign-up, no email collection, no user identification of any kind.
3. **No data leaves the device.** Image processing happens entirely in the user's browser memory. Network tab must show zero upload requests after the page loads.
4. **No tracking.** No Google Analytics, no cookies, no fingerprinting. If basic visit counting is added later, it must be privacy-friendly (e.g., GoatCounter or Plausible).
5. **Aesthetic restraint above all.** When in doubt, remove. No marketing copy, no onboarding tooltips, no feature labels.
---
## Functional Requirements
### F1. Image Input
- Single entry point: one frosted-glass circular button, centered horizontally near the bottom of the viewport.
- Button uses `<input type="file" accept="image/*" capture="environment">` to invoke the OS-native picker.
  - iPhone Safari → native menu offers "Take Photo" / "Photo Library" / "Choose File"
  - Mac Safari/Chrome → standard file picker
  - Android Chrome → "Camera" / "Files"
- Supported formats: JPEG, PNG, WebP. HEIC handled via browser-native conversion; if conversion fails, fall back gracefully (no error popup—just a subtle button shake).
- Maximum image dimension: 4000×4000px. Larger images are downscaled in-browser before processing.
### F2. Pixel Extraction (Silent)
- After file selection, the original photo is **never displayed**.
- Pixels are read via `<canvas>` `getImageData()` entirely in memory.
- Sampling density adapts to device capability:
  - Desktop: ~300,000–500,000 particles
  - Mobile: ~100,000–200,000 particles
  - Low-memory devices (detected via `navigator.deviceMemory`): ~50,000 particles
- Each particle stores: `(x, y, z)` target position, `(r, g, b)` color, and a small random offset for organic feel.
### F3. Particle Sculpture Rendering
- Rendered via Three.js using `Points` with a custom `ShaderMaterial`, or `InstancedMesh` if performance benchmarks favor it.
- Background: solid near-black (`#0a0a0a`, not pure black—avoids OLED banding).
- Particles use additive blending for natural luminosity in dense areas.
- Each particle has slight size jitter to avoid a "plastic" look.
- The sculpture slowly auto-rotates around the Y axis. Rotation speed: ~0.05 rad/s.
- Subtle ambient noise drift on each particle (low-amplitude Perlin or simplex noise) to keep the sculpture "breathing" even at rest.
### F4. Interaction — Scatter and Reassemble
- **Desktop:** mouse movement across the canvas applies a force field centered on the cursor.
- **Mobile:** touchmove applies the same force field.
- Force model: particles within a radius of the cursor are pushed outward with velocity proportional to inverse distance, simulating a wind gust.
- After the cursor stops or leaves the canvas, particles return to their target positions using a damped spring or `easeOutExpo` curve over 1.5–2.5 seconds. This "slow-motion reassembly" is the signature moment of the piece; getting the easing right is the highest-priority visual task.
- Force calculation happens in the vertex shader (GPU), not on CPU.
### F5. Frosted-Glass Button (Visual Detail)
- Circular, ~56px diameter on desktop, ~64px on mobile.
- `backdrop-filter: blur(20px) saturate(180%);`
- `background: rgba(255, 255, 255, 0.08);`
- `border: 0.5px solid rgba(255, 255, 255, 0.12);` (the half-pixel border is intentional—Retina-only detail)
- Single minimal icon inside (camera or plus glyph, ≤24px). No text label.
- On hover/touch: background opacity rises to 0.16 over 200ms.
- After image is loaded: button fades out over 400ms.
- To upload a new image: double-tap or long-press on empty canvas area re-summons the button with a fade-in.
### F6. Export (Optional, Phase 2)
- A second frosted-glass button (appears bottom-right after sculpture loads) allows the user to:
  - **Save PNG** of the current canvas frame, or
  - **Record a 5-second MP4/WebM** of the animation via `MediaRecorder API`.
- No server involved. File downloads directly to the user's device.
---
## Non-Functional Requirements
### Performance
- Time-to-first-particle (from file selection to sculpture appearing): < 1.5s for a 3MP image on a 2020-era MacBook.
- Sustained framerate: 60fps on desktop, 30fps minimum on iPhone 12 and newer.
- Total JS bundle size (gzipped): < 200KB excluding Three.js. With Three.js: < 500KB.
### Browser Support
- Required: latest Safari, Chrome, Firefox, Edge (desktop + mobile).
- Graceful degradation: if WebGL2 unavailable, show a single-line message "your browser doesn't support this experience" in the same minimal aesthetic. No fallback to 2D.
### Privacy
- Zero network requests after initial page load (verifiable in DevTools Network panel).
- No `localStorage`, `sessionStorage`, `IndexedDB`, or cookie writes in MVP. (May reconsider for "last used image thumbnail" in a later phase, but only after explicit decision.)
### Accessibility
- The upload button has an `aria-label` ("Upload an image").
- Keyboard support: `Tab` reaches the button, `Enter`/`Space` activates it.
- Respects `prefers-reduced-motion`: if set, particles still scatter but reassemble in 0.5s with reduced amplitude.
---
## Out of Scope
These features are explicitly NOT part of this project. Do not implement them. Do not propose them.
- ❌ User accounts, profiles, login, or any form of authentication
- ❌ Cloud storage of uploaded images
- ❌ Shareable URLs that load someone else's uploaded image
- ❌ Galleries of user submissions
- ❌ Backend API of any kind
- ❌ Database of any kind
- ❌ Server-side image processing
- ❌ AI/ML enhancement of images (no upscaling, no style transfer)
- ❌ Multi-user, real-time, or collaborative features
- ❌ Monetization, ads, premium tiers
- ❌ Onboarding flows, tutorials, tooltips beyond a single optional "tap to begin" hint
---
## Tech Stack (Fixed)
- **Language:** TypeScript
- **3D rendering:** Three.js (latest stable)
- **Build tool:** Vite
- **Hosting:** GitHub Pages (deployed via GitHub Actions)
- **Linter/formatter:** ESLint + Prettier
- **No framework** (no React, Vue, Svelte). Vanilla TS keeps the bundle small and matches the project's minimalist ethos.
---
## Project Phases
### Phase 1 — MVP (the "vertical slice")
- File upload via frosted-glass button
- Pixel extraction and static particle cloud rendering
- Auto-rotation
- Deploy to GitHub Pages
### Phase 2 — The Signature Interaction
- Mouse/touch scatter force field
- Slow-motion damped reassembly
- Cross-device tuning (desktop vs mobile feel)
### Phase 3 — Polish
- Bloom post-processing
- Color and easing curve fine-tuning
- Mobile performance optimization
- Reduced-motion support
### Phase 4 — Optional Export
- PNG snapshot
- Short video recording
Each phase must be deployable and demoable on its own.
