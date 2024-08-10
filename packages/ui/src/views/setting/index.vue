<template>
  <h1>设置</h1>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-suffix="："
    label-width="75px"
  >
    <el-alert type="info" class="mt10" :closable="false"
      >设置数据仅保留在本地。</el-alert
    >
    <el-form-item label="IPC" class="mt20">
      <el-input v-model="form.ipc" placeholder="请输入连接的服务端IPC名称" />
    </el-form-item>
    <el-form-item label="oa api">
      <el-input v-model="form.oaApiPrefix" placeholder="请输入OA的api前缀" />
    </el-form-item>
    <el-form-item>
      <template #label>
        <div class="flex-start">
          <qa content="如需使用登录功能，请填写webdav服务账号密码" />
          <span style="margin-left: 5px">登录：</span>
        </div>
      </template>
      <el-form-item label="账号" prop="user" label-width="60px">
        <el-input v-model="form.user" placeholder="请输入账号" />
      </el-form-item>
      <el-form-item label="密码" prop="password" label-width="60px">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="请输入密码"
        />
      </el-form-item>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="save">保存</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useGlobalStore } from "@/store";
import request from "@/helpers/request";
import Qa from "@/components/Qa.vue";

const globalStore = useGlobalStore();

const formRef = ref(null);
const form = ref({});
const rules = {};

onMounted(() => {
  form.value = globalStore.setting;
});

const save = () => {
  formRef.value.validate(async (isValid) => {
    if (!isValid) {
      return;
    }
    await request("save-setting", form.value);
    globalStore.saveSetting(form.value);
    ElMessage.success("保存成功");
  });
};
</script>
<style lang="scss" scoped>
h1 {
  font-size: 22px;
  font-weight: bold;
  color: #212121;
}
</style>
