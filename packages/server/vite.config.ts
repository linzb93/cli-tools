import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import pkg from "./package.json";
import rootPkg from "../../package.json";

const allDependencies = {
  ...pkg.dependencies,
  ...rootPkg.dependencies,
};

const input: {
  cli?: string;
  web?: string;
} = {
  cli: "src/bin/index.ts",
  web: "src/web/router.ts",
};
if (process.env.MODE === "cli") {
  delete input.web;
} else if (process.env.MODE === "web") {
  delete input.cli;
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
    emptyOutDir: !process.env.MODE,
    rollupOptions: {
      input,
      output: {
        dir: "dist",
        entryFileNames: "[name].js",
      },
      external: [...Object.keys(allDependencies), /^node:.*/],
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
