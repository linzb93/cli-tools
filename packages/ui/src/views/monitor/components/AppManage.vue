<template>
  <el-dialog
    title="应用管理"
    width="400px"
    :model-value="visible"
    @close="close"
    @closed="closed"
  >
    <div class="app-list">
      <el-checkbox-group v-model="selected">
        <div v-for="app in list" :key="app.siteId">
          <el-checkbox :value="app">{{ app.name }}</el-checkbox>
        </div>
      </el-checkbox-group>
    </div>
    <template #footer>
      <el-button @click="close">关闭</el-button>
      <el-button @click="save" type="primary">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import request from "@/helpers/request";
import { service } from "../utils";
const props = defineProps({
  visible: Boolean,
});
const emit = defineEmits(["update:visible", "confirm"]);

const list = ref([]);
const selected = ref([]);
watch(props, async ({ visible }) => {
  if (!visible || list.value.length) {
    return;
  }
  const [siteRes, selectedRes] = await Promise.all([
    service.post("/siteInfo/getSiteInfo", {
      pageSize: 100,
      pageIndex: 1,
    }),
    request("monitor-get-apps"),
  ]);
  list.value = siteRes.list;
  const selectedIds = selectedRes.list.map((item) => item.siteId);
  selected.value = siteRes.list.filter((item) =>
    selectedIds.includes(item.sid)
  );
});

// 保存
const save = async () => {
  await request(
    "monitor-save-apps",
    selected.value.map((item) => ({
      name: item.name,
      siteId: item.sid,
    }))
  );
  ElMessage({
    type: "success",
    message: "保存成功",
    onClose() {
      close();
      emit("confirm");
    },
  });
};
const close = () => {
  emit("update:visible", false);
};
const closed = () => {};
</script>
<style lang="scss" scoped>
.app-list {
  max-height: 400px;
  overflow: auto;
}
</style>
