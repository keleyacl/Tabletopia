import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@jaipur/shared': path.resolve(__dirname, '../shared/src'),
      '@jaipur/game-logic': path.resolve(__dirname, './src'),
    },
  },
});
