import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/tests/**/*.test.ts'],
    exclude: ['storage/**', 'node_modules/**', 'dist/**'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
