import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works on GitHub Pages sub-paths too.
  base: './',
  server: {
    proxy: { '/api': 'http://localhost:8787' },
  },
});
