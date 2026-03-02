import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
    resolve: {
        mainFields: ['module', 'main'],
        conditions: ['node'],
    },
    build: {
        target: 'node14',
        lib: {
            entry: 'src/index.ts',
            formats: ['es'],
            fileName: () => 'index.js',
        },
        rollupOptions: {
            external: ['vscode', ...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
        },
        sourcemap: false,
        minify: false, // 不压缩，方便排查问题
    },
});
