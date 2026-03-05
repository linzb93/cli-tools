<template>
  <el-dialog
    title="标签管理"
    :model-value="modelValue"
    width="600px"
    @update:model-value="handleClose"
  >
    <el-table :data="tagList" style="width: 100%" height="400px">
      <el-table-column label="原标签名" prop="original" width="200" />
      <el-table-column label="新标签名" prop="current">
        <template #default="{ row }">
          <el-input v-model="row.current" placeholder="请输入新标签名" />
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">
          保存修改
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/helpers/request';

const props = defineProps<{
  modelValue: boolean;
  allTags: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

interface TagEditItem {
  original: string;
  current: string;
}

const tagList = ref<TagEditItem[]>([]);
const loading = ref(false);

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      tagList.value = props.allTags.map((tag) => ({
        original: tag,
        current: tag,
      }));
    }
  }
);

const handleClose = () => {
  emit('update:modelValue', false);
};

const handleSave = async () => {
  const changes = tagList.value
    .filter((item) => item.original !== item.current && item.current.trim() !== '')
    .map((item) => ({
      from: item.original,
      to: item.current.trim(),
    }));

  if (changes.length === 0) {
    ElMessage.info('没有检测到标签修改');
    return;
  }

  loading.value = true;
  try {
    await request('/awesome/tags/edit', { tags: changes });
    ElMessage.success('标签修改成功');
    emit('success');
    handleClose();
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败');
  } finally {
    loading.value = false;
  }
};
</script>
