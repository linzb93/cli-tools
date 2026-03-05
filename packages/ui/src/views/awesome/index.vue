<template>
  <div class="awesome-container">
    <div class="header">
      <el-input
        v-model="searchParams.keyword"
        placeholder="搜索标题..."
        clearable
        @keyup.enter="handleSearch"
        style="width: 200px; margin-right: 10px"
      />
      <el-select
        v-model="searchParams.tag"
        placeholder="筛选标签"
        multiple
        collapse-tags
        clearable
        @change="handleSearch"
        style="width: 200px; margin-right: 10px"
      >
        <el-option v-for="tag in allTags" :key="tag" :label="tag" :value="tag" />
      </el-select>
      <el-switch
        v-model="untaggedOnly"
        active-text="未分类"
        @change="handleSearch"
        style="margin-right: 20px"
      />
      <el-button type="primary" @click="openEditDialog()">新增资源</el-button>
      <el-button @click="openTagManager">标签管理</el-button>
    </div>

    <el-table :data="list" style="width: 100%" v-loading="loading">
      <el-table-column prop="title" label="标题" min-width="150">
        <template #default="{ row }">
          <el-link type="primary" :href="row.url" target="_blank" :underline="false">
            {{ row.title }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="标签" min-width="150">
        <template #default="{ row }">
          <el-tag
            v-for="tag in parseTags(row.tag)"
            :key="tag"
            size="small"
            style="margin-right: 5px; margin-bottom: 5px"
          >
            {{ tag }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-popconfirm title="确定要删除吗？" @confirm="handleDelete(row)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑/新增弹窗 -->
    <EditDialog
      v-model="editVisible"
      :data="currentRow"
      :all-tags="allTags"
      @success="handleSuccess"
    />

    <!-- 标签管理弹窗 -->
    <TagManagerDialog
      v-model="tagManagerVisible"
      :all-tags="allTags"
      @success="handleTagSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/helpers/request';
import type { AwesomeItem, SearchParams } from './types';
import EditDialog from './components/EditDialog.vue';
import TagManagerDialog from './components/TagManagerDialog.vue';

const list = ref<AwesomeItem[]>([]);
const allTags = ref<string[]>([]);
const loading = ref(false);
const editVisible = ref(false);
const tagManagerVisible = ref(false);
const currentRow = ref<AwesomeItem | undefined>(undefined);

const searchParams = ref<SearchParams>({
  keyword: '',
  tag: undefined,
});
const untaggedOnly = ref(false);

const fetchList = async () => {
  loading.value = true;
  try {
    const params: any = {
      keyword: searchParams.value.keyword,
      tag: Array.isArray(searchParams.value.tag) ? searchParams.value.tag.join(',') : searchParams.value.tag,
    };
    if (untaggedOnly.value) {
      params.type = 'untagged';
    }
    const res = await request('/awesome/list', params);
    list.value = res;
  } catch (error: any) {
    ElMessage.error(error.message || '获取列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchTags = async () => {
  try {
    const res = await request('/awesome/tags');
    allTags.value = res;
  } catch (error: any) {
    console.error('获取标签失败', error);
  }
};

const handleSearch = () => {
  fetchList();
};

const parseTags = (tagStr: string) => {
  if (!tagStr) return [];
  return tagStr.split(',').map(t => t.trim()).filter(Boolean);
};

const openEditDialog = (row?: AwesomeItem) => {
  currentRow.value = row;
  editVisible.value = true;
};

const openTagManager = () => {
  tagManagerVisible.value = true;
};

const handleSuccess = () => {
  fetchList();
  fetchTags();
};

const handleTagSuccess = () => {
  fetchList();
  fetchTags();
};

const handleDelete = async (row: AwesomeItem) => {
  try {
    await request('/awesome/delete', { title: row.title });
    ElMessage.success('删除成功');
    fetchList();
    fetchTags(); // Tags might change if the deleted item was the only one with a certain tag
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败');
  }
};

onMounted(() => {
  fetchList();
  fetchTags();
});
</script>

<style scoped lang="scss">
.awesome-container {
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;

  .header {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
}
</style>
