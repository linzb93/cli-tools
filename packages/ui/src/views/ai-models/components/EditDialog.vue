<template>
  <el-dialog
    v-model="modelValue"
    :title="isEdit ? '编辑模型' : '新增模型'"
    width="550px"
    :close-on-click-modal="false"
    @close="handleClose"
    @closed="handleClosed"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入模型名称" />
      </el-form-item>

      <el-form-item label="模型" prop="model">
        <el-input v-model="form.model" placeholder="请输入模型标识" />
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
          style="width: 120px"
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
import { ref, computed, watch, useTemplateRef } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import request from '@/helpers/request';
import type { AiModel } from '@cli-tools/shared';
import { INTERFACE_FORMAT_OPTIONS, INTERFACE_FORMAT_URLS, MEDIA_TYPE_OPTIONS } from '../types';
import { AI_MODELS_PLATFORMS as PLATFORMS } from '@cli-tools/shared';
const modelValue = defineModel<boolean>({ required: true });

const props = defineProps<{
  data?: AiModel;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const formRef = useTemplateRef<FormInstance>('formRef');
const loading = ref(false);
const validating = ref(false);

const form = ref({
  name: '',
  model: '',
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
  if (form.value.platform === 'custom') return true;
  const platform = PLATFORMS.find((p) => p.value === form.value.platform);
  if (!platform) return false;
  return !!platform.urls[format];
};

const rules = ref<FormRules>({
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  model: [{ required: true, message: '请输入模型标识', trigger: 'blur' }],
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
  url: [
    {
      validator: (_rule, value, callback) => {
        if (form.value.platform === 'custom' && !value) {
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
  interfaceFormat: [{ required: true, message: '请选择接口格式', trigger: 'change' }],
  weight: [{ required: true, message: '请输入权重', trigger: 'blur' }]
});

// 根据平台和接口格式自动填充URL
const autoFillUrl = () => {
  if (form.value.platform === 'custom') return;
  const platform = PLATFORMS.find((p) => p.value === form.value.platform);
  if (!platform) return;
  if (form.value.interfaceFormat) {
    form.value.url = platform.urls[form.value.interfaceFormat] || '';
  } else {
    form.value.url = Object.values(platform.urls).find((u) => u) || '';
  }
};

const onPlatformChange = (_val: string) => {
  // 切换平台时，检查当前接口格式是否还可用
  if (form.value.interfaceFormat && !isInterfaceFormatAvailable(form.value.interfaceFormat)) {
    form.value.interfaceFormat = '';
    form.value.url = '';
  }
  autoFillUrl();
};

const onInterfaceFormatChange = (val: string) => {
  if (!val) return;
  const platform = PLATFORMS.find((p) => p.value === form.value.platform);
  if (platform) {
    form.value.url = platform.urls[val] || '';
  } else {
    form.value.url = INTERFACE_FORMAT_URLS[val] || '';
  }
};

watch(modelValue, (val) => {
  if (val) {
    if (props.data) {
      form.value.name = props.data.name;
      form.value.model = props.data.model || '';
      form.value.platform = props.data.platform;
      form.value.url = props.data.url || '';
      form.value.mediaType = props.data.mediaType;
      form.value.apiKey = props.data.apiKey;
      form.value.interfaceFormat = props.data.interfaceFormat || '';
      form.value.weight = props.data.weight;
    } else {
      resetForm();
    }
  }
});

const resetForm = () => {
  form.value.name = '';
  form.value.model = '';
  form.value.platform = '';
  form.value.url = '';
  form.value.mediaType = 'text';
  form.value.apiKey = '';
  form.value.interfaceFormat = '';
  form.value.weight = 0;
};

const handleClose = () => {
  modelValue.value = false;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const payload = {
          id: isEdit.value ? props.data?.id : undefined,
          name: form.value.name,
          model: form.value.model,
          platform: form.value.platform,
          url: form.value.url,
          mediaType: form.value.mediaType,
          apiKey: form.value.apiKey,
          interfaceFormat: form.value.interfaceFormat || '',
          weight: form.value.weight,
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
    { field: 'model', label: '模型' },
    { field: 'platform', label: '平台' },
    { field: 'url', label: 'URL' },
    { field: 'mediaType', label: '媒体类型' },
    { field: 'apiKey', label: 'API Key' },
    { field: 'interfaceFormat', label: '接口格式' }
  ];

  for (const { field, label } of fieldsToCheck) {
    const value = form.value[field as keyof typeof form.value];
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
      model: form.value.model,
      platform: form.value.platform,
      url: form.value.url,
      apiKey: form.value.apiKey,
      interfaceFormat: form.value.interfaceFormat
    });
    ElMessage.success(result?.message || '接口验证有效');
  } catch (error: any) {
    ElMessage.error(error.message || '接口验证失败');
  } finally {
    validating.value = false;
  }
};
const handleClosed = () => {
  formRef.value?.resetFields();
};
</script>
