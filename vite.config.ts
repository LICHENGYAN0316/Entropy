import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Entropy/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
});
