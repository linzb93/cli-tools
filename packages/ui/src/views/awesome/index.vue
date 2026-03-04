<template>
  <input
    placeholder="请输入依赖名称，或者标签，支持模糊搜索"
    v-model="keyword"
    @keyup.enter.prevent="handleSearch"
  />
  <el-table :data="list">
    <el-table-column prop="title" label="标题"></el-table-column>
    <el-table-column prop="description" label="描述" width="300px"></el-table-column>
    <el-table-column label="操作">
      <template #default="scope">
        <el-link :underline="false" type="primary" @click="openURL(scope.row)">打开</el-link>
      </template>
    </el-table-column>
  </el-table>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/helpers/request';

const keyword = ref('');
const list = ref([]);
const handleSearch = async () => {
  try {
    const res = await request('/awesome/search', {
      keyword: keyword.value
    });
    list.value = res;
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
};
const openURL = (row: any) => {
  window.open(row.url);
};
</script>
<style scoped lang="scss">
.awesome {
  height: 100%;
}
</style>
