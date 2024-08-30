<template>
  <el-button type="primary">添加项目</el-button>
  <el-table :data="list">
    <el-table-column label="项目名称" prop="name"></el-table-column>
    <el-table-column label="项目地址" prop="path"></el-table-column>
    <el-table-column label="操作">
      <template #default="scope">
        <el-text type="primary" @click="edit(scope.row)">编辑</el-text>
        <el-text type="primary" @click="buildServe(scope.row)">打包后启动</el-text>
        <el-dropdown @command="cmd => handleCommand(scope.row, cmd)">
          <el-text type="primary">更多</el-text>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="delete">
                <el-text type="danger">删除</el-text>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </el-table-column>
  </el-table>
  <edit-dialog v-model:visible="visible" :detail="currentRow" @submit="getList" />
</template>

<script setup>
import { ref, shallowRef, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/helpers/request'
import EditDialog from './components/EditDialog.vue';

// 列表
const list = ref([])
const getList = async () => {
  const result = await request('/vue/getList')
  list.value = result.list
}
onMounted(() => {
  getList()
})

const visible = shallowRef(false);
const currentRow = ref({});
// 编辑
const edit = (row) => {
  visible.value = true;
  currentRow.value = row;
}

// 打包后启动
const buildServe = (row) => {}

// 更多
const handleCommand = (row, cmd) => {
  if (cmd === 'delete') {
    ElMessageBox.confirm('确认删除？','温馨提醒', {
      confirmButtonText:'删除'
    })
    .then(async () => {
      await request('/vue/delete', {
        id: row.id
      });
      ElMessage.success('删除成功');
      getList();
    })
    .catch(() => {
      //
    })
  }
}
</script>
<style lang="scss" scoped></style>
