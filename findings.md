# Findings

## Discoveries & Notes
- Initialized project scaffolding plan.
- Identified need for Vite base URL config to match GitHub Pages `/Entropy/` routing.
- **ImageBitmap Decoder Pitfall**: Found that `createImageBitmap` on full-resolution 10MB+ images causes synchronous main-thread image decoding and UI freezes in desktop Chrome and Safari.
- **Lightweight Metadata Load**: Loading dimensions asynchronously via `URL.createObjectURL` and a native `Image` object retrieves natural dimensions without decoding the full texture.
- **Responsive Downscaling**: Downscaling the canvas limit to `800px` (longest edge) decreases processing volume by 4x.
- **Pre-allocation & Chunky Async Loops**: Pre-allocating `Float32Array` buffers removes dynamic array resize stutters. Yielding control via `setTimeout(..., 0)` every 50 rows keeps the main thread responsive.
