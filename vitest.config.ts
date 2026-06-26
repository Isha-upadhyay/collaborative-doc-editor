import { defineConfig, configDefaults } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Only run our own tests. Preserve Vitest's defaults (node_modules, dist, .next…)
    // and additionally skip Playwright e2e specs (run via `npm run test:e2e`).
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
