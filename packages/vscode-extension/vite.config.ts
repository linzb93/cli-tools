import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
    resolve: {
        // 关键配置：强制使用 node 入口，忽略 browser 字段，避免 ws 被打包成浏览器垫片
        mainFields: ['module', 'main'],
        conditions: ['node'],
    },
    build: {
        target: 'node14',
        lib: {
            entry: 'src/extension.ts',
            formats: ['es'],
            fileName: () => 'extension.js',
        },
        rollupOptions: {
            external: ['vscode', ...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
        },
        sourcemap: false,
        minify: false, // 不压缩，方便排查问题
    },
});
