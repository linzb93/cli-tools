<template>
  <el-button type="primary" @click="add">添加项目</el-button>
  <el-table :data="list">
    <el-table-column label="名称" prop="name"></el-table-column>
    <el-table-column label="平台">
      <template #default="scope">
        {{ getPlatformName(scope.row.platform) }}
      </template>
    </el-table-column>
    <el-table-column label="操作">
      <template #default="scope">
        <el-link type="primary" :underline="false" @click="jump(scope.row)"
          >进入</el-link
        >
        <el-link type="primary" :underline="false" @click="edit(scope.row)"
          >编辑</el-link
        >
        <delete-confirm delete-text="移除" @confirm="remove(scope.row)" />
      </template>
    </el-table-column>
  </el-table>
  <el-dialog v-model="visible" title="添加项目" width="400" @close="close">
    <el-form :model="form" label-suffix=":" label-width="130px">
      <el-form-item label="名称">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="平台">
        <el-select v-model="form.platform">
          <el-option label="阿里云" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="region">
        <el-input v-model="form.region" />
      </el-form-item>
      <el-form-item label="accessKeyId">
        <el-input v-model="form.accessKeyId" />
      </el-form-item>
      <el-form-item label="accessKeySecret">
        <el-input v-model="form.accessKeySecret" />
      </el-form-item>
      <el-form-item label="bucket">
        <el-input v-model="form.bucket" />
      </el-form-item>
      <el-form-item label="domain">
        <el-input v-model="form.domain" />
      </el-form-item>
      <el-form-item label="快捷入口">
        <el-input v-model="form.shortcut" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="submit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, shallowRef, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import request from "@/helpers/request";
import DeleteConfirm from "@/components/DeleteConfirm.vue";
import { useOssStore } from "./store";

const router = useRouter();
const ossStore = useOssStore();

const list = ref([]);
const getList = async () => {
  const data = await request("oss-get-project-list");
  list.value = data.list;
};
onMounted(async () => {
  const { setting } = await request("oss-get-setting");
  if (setting.fasterEnter === 1) {
    router.replace(`/oss/detail?id=1`);
    return;
  }
  getList();
});

const visible = shallowRef(false);
const add = () => {
  visible.value = true;
};
const edit = (item) => {
  visible.value = true;
  form.value = { ...item };
};
const form = ref({});
const close = () => {
  visible.value = false;
};
const submit = async () => {
  await request("oss-create", form.value);
  ElMessage.success(form.value.id ? "编辑成功" : "添加成功");
  close();
  getList();
};
const getPlatformName = (type) => {
  if (type === 1) {
    return "阿里云";
  }
  return "";
};
const jump = (item) => {
  ossStore.platform = item;
  router.push({
    path: "/oss/detail/",
    query: {
      id: item.id,
    },
  });
};
const remove = async (item) => {
  await request("oss-remove-account", {
    id: item.id,
  });
  ElMessage.success("移除成功");
  getList();
};
</script>
<style lang="scss" scoped>
.el-link + .el-link {
  margin-left: 10px;
}
</style>
