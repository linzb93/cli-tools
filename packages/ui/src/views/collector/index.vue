<template>
  <div>
    <el-button type="primary" @click="add()">添加</el-button>
    <el-button type="primary" @click="isEdit = true">编辑</el-button>
    <el-button type="primary" @click="managerVisible = true">管理</el-button>
  </div>
  <ul class="collect-list" v-if="list.length">
    <li v-for="item in list" :key="item.id" @click="clickSite(item)">
      <span class="name">{{ item.name }}</span>
      <template v-if="isEdit">
        <el-icon :size="14" @click="add(item)"><edit-pen /></el-icon>
        <el-icon :size="14" @click="remove(item)"><delete /></el-icon>
      </template>
    </li>
  </ul>
  <el-empty v-else>暂无数据</el-empty>
  <edit-dialog :detail="currentItem" v-model:visible="editVisible" @submit="getList" />
  <manager v-model:visible="managerVisible" @submit="getList" />
</template>

<script setup>
import { ref, shallowRef, onMounted } from 'vue'
import request from '../../helpers/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, Delete } from '@element-plus/icons-vue'
import Manager from './components/Manager.vue'
import EditDialog from './components/Edit.vue'

const list = ref([])
// 获取列表
const getList = async () => {
  list.value = await request('/collector/getVisible')
}
onMounted(() => {
  getList()
})

// 编辑
const isEdit = shallowRef(false)
const editVisible = shallowRef(false)
const currentItem = ref({})
const add = (site) => {
  if (site) {
    currentItem.value = site
  }
  editVisible.value = true
}

const remove = (site) => {
  ElMessageBox.confirm('确认删除？', '', {
    confirmButtonText: '删除'
  })
    .then(() => {
      return request('/collector/remove', {
        id: site.id
      })
    })
    .then(() => {
      ElMessage.success('删除成功')
      getList()
    })
    .catch(() => {})
}

const clickSite = (item) => {
  if (!isEdit.value) {
    open(item.url)
    return
  }
}

// 管理
const managerVisible = shallowRef(false)
</script>
<style lang="scss" scoped>
.collect-list {
  margin-top: 30px;
  line-height: 30px;
  border-radius: 2px;
  border: 1px solid #ddd;
  padding: 0 10px;
}
</style>
