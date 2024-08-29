<template>
<el-dialog :model-value="visible" title="编辑项目" width="400px">
  <el-form ref="formRef" :model="form" :rules="rules">
    <el-form-item label="名称" prop="name">
      <el-input />
    </el-form-item>
  </el-form>
</el-dialog>
</template>

<script setup>
import {cloneDeep} from 'lodash-es';
import { ElMessage } from "element-plus";
import {ref,readonly,watch} from 'vue';
import request from '@/helpers/request'
const props = defineProps({
  visible: Boolean,
  detail: Object,
})
const emit = defineEmits(['update:visible', 'submit']);
const form = ref({});
const rules = readonly({});
watch(props, ({visible}) => {
  if (!visible) {
    return;
  }
  form.value = cloneDeep(props.detail);
});
const formRef = ref(null);

const submit = () => {
  formRef.value.validate()
  .then(() => {
    return request('/vue/edit', {
      ...form.value
    });
  })
  .then(() => {
    ElMessage.success('编辑成功');
    emit('submit');
    close();
  })
  .catch(console.log)
}
const close = () => {
  emit('update:visible', false);
}
</script>
<style lang="scss" scoped>
</style>