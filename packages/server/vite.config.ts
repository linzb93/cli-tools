import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import pkg from './package.json';
import rootPkg from '../../package.json';

const allDependencies = {
    ...pkg.dependencies,
    ...rootPkg.dependencies,
};

const input: {
    [key: string]: string;
} = {};
if (process.env.MODE === 'cliTest') {
    input.vueServer = 'src/core/vue/server.ts';
    input['cli-test'] = 'src/cli/bin-test.ts';
} else if (process.env.MODE === 'cli') {
    input.vueServer = 'src/core/vue/server.ts';
    input.cli = 'src/cli/bin.ts';
} else if (process.env.MODE === 'web') {
    input.web = 'src/server/index.ts';
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
    plugins: [tsconfigPaths()],
});
