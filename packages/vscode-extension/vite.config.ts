import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
  resolve: {
    // 关键配置：强制使用 node 入口，忽略 browser 字段，避免 ws 被打包成浏览器垫片
    mainFields: ['module', 'main'],
    conditions: ['node'],
  },
  build: {
    target: 'node20',
    lib: {
      entry: 'src/extension.ts',
      formats: ['es'],
      fileName: () => 'extension.js',
    },
    rollupOptions: {
      external: [
        'vscode',
        'ws', // 将 ws 添加到 external 列表中
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
      ],
    },
    sourcemap: false,
    minify: false, // 不压缩，方便排查问题
  },
});
