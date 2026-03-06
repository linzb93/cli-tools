import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import fs from 'fs-extra';
import cdn from 'vite-plugin-cdn-import';
import vue from '@vitejs/plugin-vue';
import globalConfig from '../../config.json';

const file = fs.readJSONSync('../../cache/secret.json');
const cdnObject = file.cdn;
if (!cdnObject) {
  throw new Error('cdnObject is empty');
}

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
          path: cdnObject.vue
        },
        {
          name: 'element-plus',
          var: 'ElementPlus',
          path: cdnObject['element-plus']
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
