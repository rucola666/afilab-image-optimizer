import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Relative base for proper loading on GitHub Pages (subfolder)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
