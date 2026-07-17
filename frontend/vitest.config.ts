import { defineConfig } from 'vitest/config';
import path from 'node:path';

const threshold = Number(process.env.COVERAGE_MIN || 0);

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/lib/**/*.ts', 'src/components/**/*.{ts,tsx}'],
      exclude: ['src/components/LabGameView.tsx', 'src/components/LabSimulator.tsx'],
      thresholds: { lines: threshold, functions: threshold, branches: threshold, statements: threshold },
    },
  },
});
