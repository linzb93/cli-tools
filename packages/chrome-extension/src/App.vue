<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="container">
    <h1>Chrome Extension</h1>
    <p>Vue + Vite + TypeScript</p>
    <button @click="count++">Count is: {{ count }}</button>
  </div>
</template>

<style scoped>
.container {
  width: 300px;
  padding: 20px;
  text-align: center;
  font-family: sans-serif;
}
button {
  padding: 8px 16px;
  font-size: 16px;
  cursor: pointer;
}
</style>
