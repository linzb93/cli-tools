import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import globalConfig from '../../config.json'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: globalConfig.port.development_fe
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
