<template>
  <el-dialog :model-value="visible">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-suffix="：">
      <el-form-item label="名称" prop="name">
        <el-input placeholder="请输入名称" v-model="form.name" />
      </el-form-item>
      <el-form-item label="地址" prop="url">
        <el-input placeholder="请输入地址" v-model="form.url" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, readonly } from 'vue'
import { cloneDeep } from 'lodash-es'
import request from '../../helpers/request'
import { ElMessage } from 'element-plus'
const props = defineProps({
  detail: Object,
  visible: Boolean
})
const form = ref({
  name: '',
  url: ''
})
const formRef = ref(null)
const rules = readonly({})

watch(props, ({ visible }) => {
  if (!visible) {
    return
  }
  form.value = cloneDeep(props.detail)
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
const closed = () => {
  form.value = {
    name: '',
    url: ''
  }
}
</script>
<style lang="scss" scoped></style>
