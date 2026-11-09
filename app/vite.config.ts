import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // relative paths, so the build works from any folder on a static host
  base: './',
  test: {
    include: ['src/**/*.test.ts'],
  },
});
