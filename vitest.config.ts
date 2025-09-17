import { defineConfig } from 'vitest/config';

process.env.DATABASE_URL = process.env.DATABASE_URL ?? ':memory:';
process.env.APP_TZ = process.env.APP_TZ ?? 'Australia/Sydney';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage'
    }
  }
});
