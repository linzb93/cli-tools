import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import rootPkg from '../../package.json';
import { visualizer } from 'rollup-plugin-visualizer';

const allDependencies = {
    ...rootPkg.dependencies,
};

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(process.cwd(), 'src'),
        },
    },
    build: {
        target: 'node14',
        outDir: 'dist',
        minify: false,
        emptyOutDir: true,
        rollupOptions: {
            input: {
                index: 'src/index.ts',
                serverConstant: 'src/constant/server.ts',
            },
            output: {
                dir: 'dist',
                entryFileNames: '[name].js',
            },
            external: [...Object.keys(allDependencies).filter((dep) => dep !== '@cli-tools/shared'), /^node:.*/],
        },
        lib: {
            entry: './src/index.ts',
            fileName: 'index',
            formats: ['es'],
        },
    },
    test: {
        alias: {
            '@/': resolve(fileURLToPath(import.meta.url), './src'),
        },
    },
    plugins: [
        tsconfigPaths(),
        process.env.MODE === 'report'
            ? visualizer({
                  filename: 'stats.html',
                  open: true, // 构建后自动打开
                  gzipSize: true,
                  brotliSize: true,
              })
            : null,
    ],
});
