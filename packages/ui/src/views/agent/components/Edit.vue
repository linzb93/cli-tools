<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑' : '新增'"
    @close="handleClose"
    @closed="handleClosed"
  >
    <el-form ref="formRef" :model="form" label-width="120px">
      <el-form-item label="名称">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="前缀">
        <el-input v-model="form.prefix" />
      </el-form-item>
      <el-form-item label="规则">
        <div class="rule-list flexalign-center">
          <div class="rule-item flexalign-center" v-for="(rule, index) in form.rules" :key="index">
            <el-input v-model="rule.from" />
            <el-input v-model="rule.to" />
          </div>
          <el-icon @click="handleDeleteRule">
            <Delete />
          </el-icon>
        </div>
        <el-button type="primary" @click="handleAddRule">新增规则</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Agent } from '../types'
import request from '@/helpers/request'
import { ElForm, ElMessage } from 'element-plus'
const props = defineProps<{
  visible: boolean
  row: Agent
}>()

watch(props, ({ visible }) => {
  if (visible) {
    form.value = {
      ...props.row
    }
  }
})
const emit = defineEmits(['update:visible', 'closed', 'save'])
const isEdit = computed(() => props.row.id > 0)
const formRef = ref<InstanceType<typeof ElForm>>()
const form = ref<Agent>({
  id: 0,
  name: '',
  prefix: '',
  rules: []
})

const handleClose = () => {
  emit('update:visible', false)
}

const handleClosed = () => {
  form.value = {
    id: 0,
    name: '',
    prefix: '',
    rules: []
  }
  formRef.value?.resetFields()
}

const handleAddRule = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      request('agent/save', form.value).then(() => {
        ElMessage.success({
          message: '保存成功',
          duration: 1000,
          onClose: () => {
            emit('save')
            handleClose()
          }
        })
      })
    }
  })
}

const handleDeleteRule = (index: number) => {
  form.value.rules.splice(index, 1)
}
</script>

<style lang="scss" scoped></style>
