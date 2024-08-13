import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import pkg from "./package.json";
import rootPkg from '../../package.json';

const allDependencies = {
  ...pkg.dependencies,
  ...rootPkg.dependencies
}

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src"),
    },
  },
  build: {
    target: "node14",
    outDir: "dist",
    minify: false,
    rollupOptions: {
      input: "src/bin/index.ts",
      output: {
        dir: "dist",
        entryFileNames: "cli.js",
      },
      external: [
        ...Object.keys(allDependencies),
        /^node:.*/,
      ],
    },
    lib: {
      entry: "./src/bin/index.ts",
      fileName: "cli",
      formats: ["es"],
    },
  },
  test: {
    alias: {
      "@/": resolve(fileURLToPath(import.meta.url), "./src"),
    },
  },
  plugins: [tsconfigPaths()],
});
