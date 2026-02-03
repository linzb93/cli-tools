import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
// import cdn from 'vite-plugin-cdn-import'
import vue from '@vitejs/plugin-vue';
import globalConfig from '../../config.json';
import move from './vite-plugins/move';

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
    //       path: 'https://unpkg.com/vue@{version}/dist/vue.global.js'
    //     },
    //     {
    //       name: 'element-plus',
    //       var: 'ElementPlus',
    //       path: 'https://unpkg.com/element-plus@{version}/dist/index.full.min.js'
    //     }
    //   ]
    // }),
    move(`../server/dist/${globalConfig.prefix.static}`)
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
