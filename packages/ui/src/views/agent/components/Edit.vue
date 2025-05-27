<template>
  <el-dialog
    :model-value="visible"
    :width="600"
    :title="`${isEdit ? '编辑' : '新增'}代理`"
    @close="handleClose"
    @closed="handleClosed"
  >
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px" label-suffix="：">
      <el-form-item label="名称">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="前缀">
        <el-input v-model="form.prefix" />
      </el-form-item>
      <el-form-item label="规则">
        <div>
          <div class="rule-list">
            <div
              class="rule-item flexalign-center"
              v-for="(rule, index) in form.rules"
              :key="index"
            >
              <el-form-item label="来源" label-width="60px">
                <el-input v-model="rule.from" class="rule-input" />
              </el-form-item>
              <el-form-item label="目标" label-width="60px">
                <el-input v-model="rule.to" class="rule-input" />
              </el-form-item>
              <el-icon class="ml10" @click="handleDeleteRule">
                <Delete />
              </el-icon>
            </div>
          </div>
          <el-button type="primary" @click="handleAddRule">新增规则</el-button>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Agent } from '../types'
import request from '@/helpers/request'
import { ElForm, ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
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
const formRules = {
  name: [{ required: true, message: '请输入名称' }],
  prefix: [{ required: true, message: '请输入前缀' }],
  rules: [{ required: true, message: '请添加规则' }]
}

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
  form.value.rules.push({
    from: '',
    to: ''
  })
}

const handleSave = () => {
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

<style lang="scss" scoped>
.rule-item {
  margin-bottom: 10px;
}
.rule-input {
  width: 100px;
}
</style>
