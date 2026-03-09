import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
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
});
