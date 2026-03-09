import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@splendor/shared': path.resolve(__dirname, '../shared/src'),
      '@splendor/game-logic': path.resolve(__dirname, './src'),
    },
  },
});
