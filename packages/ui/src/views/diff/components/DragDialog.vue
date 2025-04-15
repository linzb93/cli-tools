<template>
  <el-dialog
    title="拖拽文件对比"
    v-model="visible"
    width="580px"
    :show-close="false"
    :close-on-click-modal="false"
  >
    <div class="drop-box flexalign-start">
      <div
        class="drop-item"
        @dragover.prevent.self="active = true"
        @dragleave.prevent="active = false"
        @drop="dropFile"
        @dragleave="active = false"
      >
        <p>源文件目录</p>
      </div>
      <div
        class="drop-item"
        @dragover.prevent.self="active2 = true"
        @dragleave.prevent="active2 = false"
        @drop="dropFile"
        @dragleave="active2 = false"
      >
        <p>目标文件目录</p>
      </div>
    </div>
  </el-dialog>
</template>
<script setup lang="ts">
import { shallowRef, ref } from 'vue'

const emit = defineEmits(['submit'])
const visible = shallowRef(false)

const active = shallowRef(false)
const active2 = shallowRef(false)

const result = ref({
  sourcePath: '',
  targetPath: ''
})
const dropFile = (event: any) => {
  console.log(event)
}

const submit = () => {
  emit('submit', result.value)
}
</script>
<style lang="scss" scoped>
.drop-box {
}
.drop-item {
  padding-top: 1px;
  p {
    text-align: center;
    font-size: 14px;
    color: #999;
    margin-top: 10px;
  }
}
</style>
