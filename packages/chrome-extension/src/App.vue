<script setup lang="ts">
import { ElButton, ElMessage } from 'element-plus'

async function copyToken() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) {
      ElMessage.error('无法获取当前标签页')
      return
    }
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getLocalStorage' })
    if (response?.token) {
      await navigator.clipboard.writeText(response.token)
      ElMessage.success('Token 复制成功')
    } else {
      ElMessage.error('未找到 Token')
    }
  } catch {
    ElMessage.error('复制失败，请确保页面已加载 content script')
  }
}
</script>

<template>
  <div class="container">
    <h1>Chrome Extension</h1>
    <p>Vue + Vite + TypeScript + Element Plus</p>
    <ElButton type="primary" @click="copyToken">复制 Token</ElButton>
  </div>
</template>

<style scoped>
.container {
  width: 300px;
  padding: 20px;
  text-align: center;
  font-family: sans-serif;
}
</style>
