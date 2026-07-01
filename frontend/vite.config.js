import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vercel's @vercel/static-build serves this build's output at /frontend/*
  // (it strips only the configured distDir segment, not the src directory),
  // so built asset URLs must be prefixed to match where they're actually hosted.
  base: '/frontend/',
  server: {
    port: 5173,
  },
});
