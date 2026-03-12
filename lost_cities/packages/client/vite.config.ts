import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/lost-cities/' : '/',
  plugins: [react()],
  server: {
    port: 3004,
    strictPort: true,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3005',
        ws: true,
        changeOrigin: true,
      },
    },
  },
}));
