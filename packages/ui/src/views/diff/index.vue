<template>
  <div class="flexalign-start">
    <div class="flex-item">
      <div v-for="(item, index) in leftPanel" :key="index" :class="item.type">{{ item.value }}</div>
    </div>
    <div class="flex-item">
      <div v-for="(item, index) in rightPanel" :key="index" :class="item.type">
        {{ item.value }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { diffLines } from 'diff'
import request from '../../helpers/request'

interface PanelItem {
  type: string
  value: string
}

const leftPanel = ref<PanelItem[]>([])
const rightPanel = ref<PanelItem[]>([])

onMounted(async () => {
  const file1 = await request('/readFile', {
    path: ''
  })
  const file2 = await request('/readFile', {
    path: ''
  })
  const diff = diffLines(file1.result, file2.result)
  console.log(diff)
  diff.forEach((item, index) => {
    if (item.added) {
      rightPanel.value = rightPanel.value.concat(
        item.value.split('\n').map((line) => ({
          type: 'added',
          value: line
        }))
      )
    } else if (item.removed) {
      leftPanel.value = leftPanel.value.concat(
        item.value.split('\n').map((line) => ({
          type: 'removed',
          value: line
        }))
      )
    } else {
      leftPanel.value = leftPanel.value.concat(
        item.value.split('\n').map((line) => ({
          type: 'normal',
          value: line
        }))
      )
      rightPanel.value = rightPanel.value.concat(
        item.value.split('\n').map((line) => ({
          type: 'normal',
          value: line
        }))
      )
    }
  })
})
</script>
<style lang="scss" scoped>
.flex-item {
  width: 50%;
  white-space: pre-wrap;
  padding: 3px 5px;
}
.added {
  color: green;
  background: lighten($color: green, $amount: 60%);
}
.removed {
  color: red;
  background: lighten($color: red, $amount: 40%);
}
</style>
