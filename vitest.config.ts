import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      enabled: false,
      exclude: ['src/models/**', 'src/theme/**', '**/*.d.ts'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      provider: 'v8',
      reporter: ['lcov', 'text', 'text-summary'],
    },
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/testSetup.ts'],
    watch: true,
  },
});
