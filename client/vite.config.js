import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // During development the React app runs here and forwards every /api and
    // /uploads request to Express. Same-origin from the browser's point of
    // view, so there is no CORS setup to worry about.
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  build: { outDir: 'dist' },
});
