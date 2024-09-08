<template>
  <el-dialog :model-value="visible">
    <el-raido-group>
      <div v-for="item in list" :key="item.id"></div>
    </el-raido-group>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import request from '../../helpers/request'
import { ElMessage } from 'element-plus'
const props = defineProps({
  visible: Boolean
})
const list = ref([])
const getList = async () => {
  list.value = await request('/collector/getAll')
}
watch(props, ({ visible }) => {
  if (!visible) {
    return
  }
  getList()
})

const emit = defineEmits(['update:visible', 'submit'])

const submit = async () => {
  await request('/collector/save', {
    list: list.value
  })
  ElMessage.success('设置成功')
  emit('submit')
}

const close = () => {
  emit('update:visible', false)
}
</script>
<style lang="scss" scoped></style>
