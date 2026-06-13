<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑模型' : '新增模型'"
    width="550px"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入模型名称" />
      </el-form-item>

      <el-form-item label="平台" prop="platform">
        <el-select
          v-model="form.platform"
          placeholder="请选择平台"
          style="width: 100%"
          @change="onPlatformChange"
        >
          <el-option
            v-for="opt in PLATFORMS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="URL" prop="url">
        <el-input
          v-model="form.url"
          placeholder="请输入接口地址"
          :disabled="form.platform !== 'custom'"
        />
      </el-form-item>

      <el-form-item label="接口格式" prop="interfaceFormat">
        <el-radio-group v-model="form.interfaceFormat" @change="onInterfaceFormatChange">
          <el-radio
            v-for="opt in INTERFACE_FORMAT_OPTIONS"
            :key="opt.value"
            :value="opt.value"
            :disabled="!isInterfaceFormatAvailable(opt.value)"
          >
            {{ opt.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="媒体类型" prop="mediaType">
        <el-radio-group v-model="form.mediaType">
          <el-radio v-for="opt in MEDIA_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="apiKey" prop="apiKey">
        <el-input v-model="form.apiKey" placeholder="请输入 API Key" />
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
        <el-button type="warning" :loading="validating" @click="handleValidate">
          验证有效性
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit"> 确定 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import request from '@/helpers/request';
import type { AiModel } from '@cli-tools/shared';
import { INTERFACE_FORMAT_OPTIONS, INTERFACE_FORMAT_URLS, MEDIA_TYPE_OPTIONS } from '../types';
import { AI_MODELS_PLATFORMS as PLATFORMS } from '@cli-tools/shared';
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
const validating = ref(false);

const form = reactive({
  name: '',
  platform: '',
  url: '',
  mediaType: 'text' as 'text' | 'image',
  apiKey: '',
  interfaceFormat: '',
  weight: 0
});

const isEdit = computed(() => !!props.data);

// 检查当前平台下某个接口格式是否可用（有对应的URL）
const isInterfaceFormatAvailable = (format: string): boolean => {
  if (form.platform === 'custom') return true;
  const platform = PLATFORMS.find((p) => p.value === form.platform);
  if (!platform) return false;
  return !!platform.urls[format];
};

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
      trigger: 'blur'
    }
  ],
  mediaType: [{ required: true, message: '请选择媒体类型', trigger: 'change' }],
  apiKey: [{ required: true, message: '请输入 API Key', trigger: 'blur' }],
  interfaceFormat: [
    { required: true, message: '请选择接口格式', trigger: 'change' }
  ],
  weight: [{ required: true, message: '请输入权重', trigger: 'blur' }]
});

// 根据平台和接口格式自动填充URL
const autoFillUrl = () => {
  if (form.platform === 'custom') return;
  const platform = PLATFORMS.find((p) => p.value === form.platform);
  if (!platform) return;
  if (form.interfaceFormat) {
    form.url = platform.urls[form.interfaceFormat] || '';
  } else {
    form.url = Object.values(platform.urls).find((u) => u) || '';
  }
};

const onPlatformChange = (_val: string) => {
  // 切换平台时，检查当前接口格式是否还可用
  if (form.interfaceFormat && !isInterfaceFormatAvailable(form.interfaceFormat)) {
    form.interfaceFormat = '';
    form.url = '';
  }
  autoFillUrl();
};

const onInterfaceFormatChange = (val: string) => {
  if (!val) return;
  const platform = PLATFORMS.find((p) => p.value === form.platform);
  if (platform) {
    form.url = platform.urls[val] || '';
  } else {
    form.url = INTERFACE_FORMAT_URLS[val] || '';
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
        form.interfaceFormat = props.data.interfaceFormat || '';
        form.weight = props.data.weight;
      } else {
        resetForm();
      }
    }
  }
);

const resetForm = () => {
  form.name = '';
  form.platform = '';
  form.url = '';
  form.mediaType = 'text';
  form.apiKey = '';
  form.interfaceFormat = '';
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
          interfaceFormat: form.interfaceFormat || '',
          weight: form.weight,
          oldId: isEdit.value ? props.data?.id : undefined
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

// 验证模型有效性
const handleValidate = async () => {
  if (!formRef.value) return;

  // 先检查所有必填字段
  let hasError = false;
  const fieldsToCheck = [
    { field: 'name', label: '名称' },
    { field: 'platform', label: '平台' },
    { field: 'url', label: 'URL' },
    { field: 'mediaType', label: '媒体类型' },
    { field: 'apiKey', label: 'API Key' },
    { field: 'interfaceFormat', label: '接口格式' },
  ];

  for (const { field, label } of fieldsToCheck) {
    const value = (form as any)[field];
    if (!value || (typeof value === 'string' && !value.trim())) {
      ElMessage.warning(`请填写${label}`);
      hasError = true;
      break;
    }
  }

  if (hasError) return;

  validating.value = true;
  try {
    const result = await request('/ai-model/validate', {
      platform: form.platform,
      url: form.url,
      apiKey: form.apiKey,
      interfaceFormat: form.interfaceFormat,
    });
    ElMessage.success(result?.message || '接口验证有效');
  } catch (error: any) {
    ElMessage.error(error.message || '接口验证失败');
  } finally {
    validating.value = false;
  }
};
</script>
