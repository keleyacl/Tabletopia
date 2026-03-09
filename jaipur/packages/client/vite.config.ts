import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3006,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@jaipur/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});