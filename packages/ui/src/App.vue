<template>
  <div class="container full-height flexalign-start">
    <menus />
    <div class="flexitem-1 cont full-height">
      <router-view />
    </div>
  </div>
</template>
<script setup>
import Menus from './components/Menus.vue'
import { useGlobalStore } from '@/store'

const globalStore = useGlobalStore()
globalStore.getSetting()
// globalStore.listenIpcConnected();
if (process.env.NODE_ENV === 'development') {
  document.title = '我的工具箱（开发版）';
} else {
  document.title = '我的工具箱';
}
</script>
<style scoped>
.cont {
  padding: 20px;
  height: 100%;
  overflow: auto;
}
</style>
<style>
#app {
  height: 100%;
}
</style>
