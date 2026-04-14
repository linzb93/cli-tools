import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'fs-extra'
import cdn from 'vite-plugin-cdn-import'

const file = fs.readJSONSync('../../cache/secret.json')
const cdnObject = file.cdn
if (!cdnObject) {
  throw new Error('cdnObject is empty')
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    cdn({
      modules: [
        { name: 'vue', var: 'Vue', path: cdnObject.vue },
        { name: 'element-plus', var: 'ElementPlus', path: cdnObject['element-plus'] }
      ]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist'
  }
})
