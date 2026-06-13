<template>
  <div class="ai-models-container">
    <div class="header">
      <el-button type="primary" @click="openEditDialog()">新增模型</el-button>
      <el-button type="warning" @click="handleSyncCcSwitch" :loading="syncing">
        同步CC Switch
      </el-button>
    </div>

    <el-table :data="list" style="width: 100%" v-loading="loading">
      <el-table-column prop="name" label="自定义名称" min-width="150" />
      <el-table-column label="所属平台" width="120">
        <template #default="{ row }">
          {{ platformLabel(row.platform) }}
        </template>
      </el-table-column>
      <el-table-column label="媒体类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.mediaType === 'image' ? 'warning' : ''" size="small">
            {{ row.mediaType === 'text' ? '文本' : '图片' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="接口格式" min-width="120">
        <template #default="{ row }">
          <el-tag v-if="row.interfaceFormat" size="small">
            {{ row.interfaceFormat }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="weight" label="权重" width="80" align="center" />
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

    <EditDialog v-model="editVisible" :data="currentRow" @success="fetchList" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/helpers/request';
import type { AiModel } from '@cli-tools/shared';
import { AI_MODELS_PLATFORMS as PLATFORMS } from '@cli-tools/shared';
import EditDialog from './components/EditDialog.vue';

const list = ref<AiModel[]>([]);
const loading = ref(false);
const syncing = ref(false);
const editVisible = ref(false);
const currentRow = ref<AiModel | undefined>(undefined);

const platformLabel = (value: string) => {
  const found = PLATFORMS.find((opt) => opt.value === value);
  return found?.label || value;
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await request('/ai-model/list');
    list.value = res || [];
  } catch (error: any) {
    ElMessage.error(error.message || '获取列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSyncCcSwitch = async () => {
  syncing.value = true;
  try {
    await request('/ai-model/sync-cc-switch');
    ElMessage.success('同步成功');
    fetchList();
  } catch (error: any) {
    ElMessage.error(error.message || '同步失败');
  } finally {
    syncing.value = false;
  }
};

const openEditDialog = (row?: AiModel) => {
  currentRow.value = row;
  editVisible.value = true;
};

const handleDelete = async (row: AiModel) => {
  try {
    await request('/ai-model/delete', { id: row.id });
    ElMessage.success('删除成功');
    fetchList();
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败');
  }
};

onMounted(() => {
  fetchList();
});
</script>

<style scoped lang="scss">
.ai-models-container {
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
