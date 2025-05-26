<template>
  <el-table :data="tableData" style="width: 100%">
    <el-table-column prop="name" label="名称" />
    <el-table-column prop="prefix" label="前缀" />
    <el-table-column prop="rule" label="规则">
      <template #default="scope">
        {{ scope.row.rule }}
      </template>
    </el-table-column>
    <el-table-column prop="action" label="操作">
      <template #default="scope">
        <el-button type="primary" @click="handleEdit(scope.row)">编辑</el-button>
        <el-button type="danger" @click="handleDelete(scope.row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
  <edit v-model:visible="editVisible" :row="editRow" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Edit from './components/Edit.vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import request from '@/helpers/request'
import type { Agent } from './types'
const tableData = ref<Agent[]>([])
const editVisible = ref(false)
const editRow = ref<Agent>({
  id: 0,
  name: '',
  prefix: '',
  rules: []
})

const handleEdit = (row: Agent) => {
  editRow.value = row
  editVisible.value = true
}

const handleDelete = (row: Agent) => {
  ElMessageBox.confirm('确定删除吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    request('agent/delete', {
      id: row.id
    }).then(() => {
      ElMessage.success({
        message: '删除成功',
        duration: 1000,
        onClose: () => {
          getList()
        }
      })
    })
  })
}

const getList = () => {
  request('agent/list').then((res) => {
    tableData.value = res
  })
}

onMounted(() => {
  getList()
})
</script>
<style lang="scss" scoped></style>
