import { defineConfig } from 'vite';

export default defineConfig({
  // Relative assets work both at a custom domain and under /blockcraft-classic/.
  base: './',
  build: { target: 'es2022', sourcemap: true },
});
