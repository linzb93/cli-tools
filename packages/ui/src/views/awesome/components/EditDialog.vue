<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑资源' : '新增资源'"
    width="500px"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入标题" />
      </el-form-item>
      <el-form-item label="URL" prop="url">
        <el-input v-model="form.url" placeholder="请输入链接地址" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          placeholder="请输入描述"
          :rows="3"
        />
      </el-form-item>
      <el-form-item label="标签" prop="tag">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="请选择或输入标签"
          style="width: 100%"
        >
          <el-option v-for="tag in allTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import request from '@/helpers/request';
import type { AwesomeItem } from '../types';

const props = defineProps<{
  modelValue: boolean;
  data?: AwesomeItem;
  allTags: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  title: '',
  url: '',
  description: '',
  tags: [] as string[],
});

const isEdit = computed(() => !!props.data);

const rules = reactive<FormRules>({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  url: [{ required: true, message: '请输入URL', trigger: 'blur' }],
});

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      if (props.data) {
        form.title = props.data.title;
        form.url = props.data.url;
        form.description = props.data.description;
        form.tags = props.data.tag ? props.data.tag.split(',').map((t) => t.trim()).filter(Boolean) : [];
      } else {
        form.title = '';
        form.url = '';
        form.description = '';
        form.tags = [];
      }
    }
  }
);

const handleClose = () => {
  emit('update:modelValue', false);
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const payload = {
          title: form.title,
          url: form.url,
          description: form.description,
          tag: form.tags.join(','),
          oldTitle: isEdit.value ? props.data?.title : undefined,
        };
        await request('/awesome/save', payload);
        ElMessage.success(isEdit.value ? '修改成功' : '新增成功');
        emit('success');
        handleClose();
      } catch (error: any) {
        ElMessage.error(error.message || '保存失败');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>
