<template>
  <div class="flexalign-start" v-if="loaded">
    <div class="flex-item">
      <div v-for="(item, index) in leftPanel" :key="index" :class="item.type">{{ item.value }}</div>
    </div>
    <div class="flex-item">
      <div v-for="(item, index) in rightPanel" :key="index" :class="item.type">
        {{ item.value }}
      </div>
    </div>
  </div>
  <drag-dialog v-else @submit="start" />
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted } from 'vue'
import { diffLines } from 'diff'
import request from '../../helpers/request'
import DragDialog from './components/DragDialog.vue'

interface PanelItem {
  type: string
  value: string
}
const loaded = shallowRef(false)
const visible = shallowRef(false)
const isCompareFolder = shallowRef(true)
const currentPath = shallowRef('')

const leftPanel = ref<PanelItem[]>([])
const rightPanel = ref<PanelItem[]>([])

const start = async ({ sourcePath, targetPath }: { sourcePath: string; targetPath: string }) => {
  const res = await request('/diff/folder', {
    sourcePath,
    targetPath
  })
  console.log(res.diff)
  res.diff.forEach((item, index) => {
    if (item.added) {
      rightPanel.value = rightPanel.value.concat(
        item.value.map((line) => ({
          type: 'added',
          value: line
        }))
      )
    } else if (item.removed) {
      leftPanel.value = leftPanel.value.concat(
        item.value.map((line) => ({
          type: 'removed',
          value: line
        }))
      )
    } else {
      leftPanel.value = leftPanel.value.concat(
        item.value.map((line) => ({
          type: 'normal',
          value: line
        }))
      )
      rightPanel.value = rightPanel.value.concat(
        item.value.map((line) => ({
          type: 'normal',
          value: line
        }))
      )
    }
  })
  // const file1 = await request('/readFile', {
  //   path: ''
  // })
  // const file2 = await request('/readFile', {
  //   path: ''
  // })
  // const diff = diffLines(file1.result, file2.result)
  // console.log(diff)
  // diff.forEach((item, index) => {
  //   if (item.added) {
  //     rightPanel.value = rightPanel.value.concat(
  //       item.value.split('\n').map((line) => ({
  //         type: 'added',
  //         value: line
  //       }))
  //     )
  //   } else if (item.removed) {
  //     leftPanel.value = leftPanel.value.concat(
  //       item.value.split('\n').map((line) => ({
  //         type: 'removed',
  //         value: line
  //       }))
  //     )
  //   } else {
  //     leftPanel.value = leftPanel.value.concat(
  //       item.value.split('\n').map((line) => ({
  //         type: 'normal',
  //         value: line
  //       }))
  //     )
  //     rightPanel.value = rightPanel.value.concat(
  //       item.value.split('\n').map((line) => ({
  //         type: 'normal',
  //         value: line
  //       }))
  //     )
  //   }
  // })
}
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
