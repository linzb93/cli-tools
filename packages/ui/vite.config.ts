import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
// import cdn from 'vite-plugin-cdn-import'
import vue from '@vitejs/plugin-vue'
import globalConfig from '../../config.json'
import move from './vite-plugins/move'

// https://vitejs.dev/config/
export default defineConfig({
  base: `/${globalConfig.prefix.static}/`,
  server: {
    port: globalConfig.port.development_fe
  },
  define: {
    'process.platform': JSON.stringify(process.platform)
  },
  plugins: [
    vue(),
    // cdn({
    //   modules: [
    //     {
    //       name: 'vue',
    //       var: 'Vue',
    //       path: 'https://cdn.bootcdn.net/ajax/libs/vue/{version}/vue.global.prod.min.js'
    //     },
    //     {
    //       name: 'element-plus',
    //       var: 'ElementPlus',
    //       path: 'https://cdn.bootcdn.net/ajax/libs/element-plus/{version}/index.full.min.js'
    //     }
    //   ]
    // }),
    move('../server/dist/pages')
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
