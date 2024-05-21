import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    alias: {
      '@/': resolve(fileURLToPath(import.meta.url), './src')
    }
  },
  plugins: [tsconfigPaths()]
});
