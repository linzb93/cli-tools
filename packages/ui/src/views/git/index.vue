<template>
  <el-form label-suffix="：">
    <h2>
      <span>Git项目同步检查</span>
    </h2>
    <el-form-item label="选择项目">
      <select-dirs v-model:dirs="gitDirs" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="save">保存</el-button>
      <el-button type="primary" @click="getList">查看结果</el-button>
    </el-form-item>
  </el-form>
  <p>已扫描{{ data }}个</p>
  <template v-if="loaded">
    <el-alert class="mt30" type="info" :closable="false">扫描完成，用时{{ duration }}秒</el-alert>
    <div class="mt20">
      <el-button type="primary" @click="openInEditor()">批量打开编辑器</el-button>
    </div>
    <el-table :data="result.list" class="mt20" @selection-change="handleSelectionChange">
      <el-table-column type="selection" />
      <el-table-column label="项目名称" prop="name"></el-table-column>
      <el-table-column label="文件夹" prop="folderName"></el-table-column>
      <el-table-column sortable prop="status" label="状态">
        <template #default="scope">
          <p class="red" v-if="scope.row.status === 1">未提交</p>
          <p class="yellow" v-else-if="scope.row.status === 2">未推送</p>
          <p class="gray" v-else-if="scope.row.status === 4">不在主分支上</p>
          <p v-else>非Git项目</p>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="openInEditor(scope.row)"
            >打开编辑器</el-link
          >
        </template>
      </el-table-column>
    </el-table>
  </template>
</template>

<script setup lang="ts">
import { shallowRef, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import SelectDirs from './components/SelectDirs.vue'
import request, { baseURL } from '../../helpers/request'
import * as requestUtil from '../../helpers/request/api'
import useSSE from '@/hooks/useSSE'
const gitDirs = ref([])
onMounted(async () => {
  const res = await request('/schedule/get')
  if (!res) {
    return
  }
  gitDirs.value = res.list
})

const save = async () => {
  await request('/schedule/save', gitDirs.value)
  ElMessage.success('保存成功')
}
const { fetchData, data, loaded, result } = useSSE(baseURL + '/schedule/gitScanResult')
const duration = shallowRef('0')
const getList = async () => {
  if (!gitDirs.value.length) {
    ElMessage.error('请选择扫描的目录')
    return
  }
  const startTime = Date.now()
  await fetchData()
  duration.value = ((Date.now() - startTime) / 1000).toFixed(2)
}

const selected = shallowRef([])
const handleSelectionChange = (rows) => {
  selected.value = rows
}
const openInEditor = (row) => {
  if (row) {
    requestUtil.open('vscode', row.path)
    return
  }
  requestUtil.open(
    'vscode',
    selected.value.map((item) => item.path)
  )
}
</script>
<style lang="scss" scoped>
h2 {
  font-size: 18px;
  color: #000;
  font-weight: bold;
  margin-bottom: 20px;
}
.input-large {
  width: 200px;
}
.input-medium {
  width: 130px !important;
}
.monitor-con {
  p {
    margin-bottom: 10px;
  }
}
.mx10 {
  margin-left: 10px;
  margin-right: 10px;
}
.red {
  color: #f56c6c;
}
.gray {
  color: #909399;
}
.yellow {
  color: #e6a23c;
}
.head {
  font-size: 16px;
  color: #212121;
}
</style>
