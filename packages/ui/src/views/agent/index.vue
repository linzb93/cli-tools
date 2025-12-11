<template>
  <el-button type="primary" @click="handleAdd">新增代理</el-button>
  <el-table :data="tableData" style="width: 100%">
    <el-table-column prop="name" label="名称" width="130" />
    <el-table-column prop="prefix" label="前缀" width="130" />
    <el-table-column prop="rule" label="规则">
      <template #default="scope">
        <p v-for="rule in scope.row.rules" :key="rule.to" class="flexalign-center">
          <span style="color: #409eff">{{ rule.from }}</span>
          <el-icon style="margin: 0 5px"><right /></el-icon>
          <span style="color: #67c23a">{{ rule.to }}</span>
        </p>
      </template>
    </el-table-column>
    <el-table-column prop="action" label="操作">
      <template #default="scope">
        <el-button type="primary" @click="handleEdit(scope.row)">编辑</el-button>
        <el-button type="primary" @click="handleDebug(scope.row)">调试</el-button>
        <el-button type="danger" @click="handleDelete(scope.row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
  <edit-dialog v-model:visible="editVisible" :row="editRow" @save="getList" />
  <debug-dialog v-model:visible="debugVisible" :rules="editRow.rules" @save="getList" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Right } from '@element-plus/icons-vue'
import EditDialog from './components/Edit.vue'
import DebugDialog from './components/DebugDialog.vue'
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

const debugVisible = ref(false)
const handleDebug = (row: Agent) => {
  if (row.rules.length === 0) {
    ElMessage.error('请先添加规则')
    return
  }
  editRow.value = row
  debugVisible.value = true
}

const handleAdd = () => {
  editRow.value = {
    id: 0,
    name: '',
    prefix: '',
    rules: []
  }
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
