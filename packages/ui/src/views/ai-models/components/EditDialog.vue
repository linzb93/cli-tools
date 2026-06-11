<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑模型' : '新增模型'"
    width="550px"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入模型名称" />
      </el-form-item>

      <el-form-item label="平台" prop="platform">
        <el-select v-model="form.platform" placeholder="请选择平台" style="width: 100%" @change="onPlatformChange">
          <el-option
            v-for="opt in PLATFORM_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item v-if="form.platform === 'custom'" label="URL" prop="url">
        <el-input v-model="form.url" placeholder="请输入接口地址" />
      </el-form-item>

      <el-form-item label="媒体类型" prop="mediaType">
        <el-radio-group v-model="form.mediaType">
          <el-radio
            v-for="opt in MEDIA_TYPE_OPTIONS"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="apiKey" prop="apiKey">
        <el-input v-model="form.apiKey" placeholder="请输入 API Key" />
      </el-form-item>

      <el-form-item label="接口格式" prop="interfaceFormat">
        <el-select
          v-model="form.interfaceFormat"
          multiple
          placeholder="请选择接口格式"
          style="width: 100%"
          @change="onInterfaceFormatChange"
        >
          <el-option
            v-for="opt in INTERFACE_FORMAT_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="权重" prop="weight">
        <el-input-number
          v-model="form.weight"
          :min="0"
          :max="100"
          placeholder="请输入权重"
          style="width: 100%"
        />
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
import type { AiModel } from '../types';
import {
  PLATFORM_OPTIONS,
  PLATFORM_DEFAULT_URLS,
  INTERFACE_FORMAT_OPTIONS,
  INTERFACE_FORMAT_URLS,
  MEDIA_TYPE_OPTIONS,
} from '../types';

const props = defineProps<{
  modelValue: boolean;
  data?: AiModel;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  name: '',
  platform: '',
  url: '',
  mediaType: 'text' as 'text' | 'image',
  apiKey: '',
  interfaceFormat: [] as string[],
  weight: 0,
});

const isEdit = computed(() => !!props.data);

const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
  url: [
    {
      validator: (_rule, value, callback) => {
        if (form.platform === 'custom' && !value) {
          callback(new Error('请输入接口地址'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  mediaType: [{ required: true, message: '请选择媒体类型', trigger: 'change' }],
  apiKey: [{ required: true, message: '请输入 API Key', trigger: 'blur' }],
  interfaceFormat: [
    {
      type: 'array',
      required: true,
      message: '请选择接口格式',
      trigger: 'change',
    },
  ],
  weight: [{ required: true, message: '请输入权重', trigger: 'blur' }],
});

const onPlatformChange = (val: string) => {
  if (val && val !== 'custom') {
    form.url = PLATFORM_DEFAULT_URLS[val] || '';
  }
};

const onInterfaceFormatChange = (val: string[]) => {
  if (val.length === 1) {
    form.url = INTERFACE_FORMAT_URLS[val[0]] || '';
  } else if (val.length > 1) {
    form.url = INTERFACE_FORMAT_URLS[val[0]] || '';
  }
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      if (props.data) {
        form.name = props.data.name;
        form.platform = props.data.platform;
        form.url = props.data.url || '';
        form.mediaType = props.data.mediaType;
        form.apiKey = props.data.apiKey;
        form.interfaceFormat = [...props.data.interfaceFormat];
        form.weight = props.data.weight;
      } else {
        resetForm();
      }
    }
  },
);

const resetForm = () => {
  form.name = '';
  form.platform = '';
  form.url = '';
  form.mediaType = 'text';
  form.apiKey = '';
  form.interfaceFormat = [];
  form.weight = 0;
};

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
          id: isEdit.value ? props.data?.id : undefined,
          name: form.name,
          platform: form.platform,
          url: form.url,
          mediaType: form.mediaType,
          apiKey: form.apiKey,
          interfaceFormat: form.interfaceFormat,
          weight: form.weight,
          oldId: isEdit.value ? props.data?.id : undefined,
        };
        await request('/ai-model/save', payload);
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
