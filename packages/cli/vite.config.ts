import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import pkg from './package.json';
import rootPkg from '../../package.json';
import { visualizer } from 'rollup-plugin-visualizer';

const allDependencies = {
    ...pkg.dependencies,
    ...rootPkg.dependencies,
};

const input: {
    [key: string]: string;
} = {};
console.log(process.env.MODE);
if (process.env.MODE === 'cliTest') {
    input['cli-test'] = 'src/bin-test.ts';
} else if (['cli', 'report'].includes(process.env.MODE as string)) {
    input.cli = 'src/bin.ts';
}

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
        emptyOutDir: !process.env.MODE,
        rollupOptions: {
            input,
            output: {
                dir: 'dist',
                entryFileNames: '[name].js',
            },
            external: [
                ...Object.keys(allDependencies),
                /^node:.*/,
                'assert',
                'events', // 这两个是因为listr模块添加的
            ],
        },
        lib: {
            entry: './src/bin/index.ts',
            fileName: 'cli',
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
