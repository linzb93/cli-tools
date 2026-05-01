import { defineConfig } from 'vitest/config';
import path from 'node:path';

// 配置文件所在目录
const configDir = path.dirname(path.resolve(import.meta.url.replace('file://', '')));

export default defineConfig({
    test: {
        include: ['src/**/__tests__/**/*.test.ts'],
        exclude: ['**/node_modules/**'],
    },
    resolve: {
        alias: {
            '@': path.join(configDir, 'src'),
        },
    },
});