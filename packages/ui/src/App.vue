<template>
  <div class="cont full-height flexalign-start">
    <router-view />
  </div>
</template>
<script setup lang="ts">
import { useGlobalStore } from '@/store';

const globalStore = useGlobalStore();
globalStore.getSetting();
document.title = `我的工具箱${process.env.NODE_ENV === 'development' ? '（开发版）' : ''}`;

document.body.addEventListener('dragover', function (event) {
  event.preventDefault();
});
document.body.addEventListener('drop', function (event) {
  event.preventDefault();
});
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
