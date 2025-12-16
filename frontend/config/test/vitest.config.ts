import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    // Keep Vitest focused on unit/integration tests under src/.
    // Playwright specs live under e2e/ and should be run via `pnpm test:e2e`.
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'config/**',
      'mock-server/**',
      'e2e/**',
      '**/*.config.{js,ts}',
      '**/*.d.ts',
      'playwright-report/**',
      'test-results/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'config/**',
        'mock-server/**',
        'e2e/**',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        'playwright-report/**',
        'test-results/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
    },
  },
});
