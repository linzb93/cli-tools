import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import cdn from 'vite-plugin-cdn-import';
import vue from '@vitejs/plugin-vue';
import globalConfig from '../../config.json';

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
    cdn({
      modules: [
        {
          name: 'vue',
          var: 'Vue',
          path: 'https://cdn.staticfile.org/vue/3.5.6/vue.global.min.js'
        },
        {
          name: 'element-plus',
          var: 'ElementPlus',
          path: 'https://cdn.staticfile.org/element-plus/2.11.4/index.full.min.js'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
