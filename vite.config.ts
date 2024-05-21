import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "/src"),
    },
  },
  build: {
    target: "modules",
    lib: {
      entry: "./src/bin/index.ts",
      fileName: "index",
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
