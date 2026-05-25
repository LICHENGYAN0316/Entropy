# Shaders Directory

This folder holds GLSL vertex and fragment shaders (with `.glsl` extension).
Shaders are imported into TypeScript modules using Vite's `?raw` import syntax, e.g.:

```typescript
import vertexShader from './shaders/vertex.glsl?raw';
```
