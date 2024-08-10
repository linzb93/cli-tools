<template>
  <el-drawer
    :size="800"
    :model-value="visible"
    title="历史记录"
    @close="close"
    @closed="closed"
  >
    <el-table :data="list">
      <el-table-column label="名称" prop="name">
        <template #default="scope">
          <el-link type="primary" @click="gotoFile(scope.row)">{{
            pathUtil.basename(scope.row.path)
          }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="图片">
        <template #default="scope">
          <el-image class="preview" :src="scope.row.path" fit="cover" />
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      background
      class="mt30"
      :total="totalCount"
      hide-on-single-page
      :page-size="query.pageSize"
      v-model:current-page="query.pageIndex"
      @change="getList"
    />
  </el-drawer>
</template>

<script setup>
import { ref, shallowRef, reactive, shallowReactive, watch } from "vue";
import request from "@/helpers/request";
import pathUtil from "@/helpers/path";
const props = defineProps({
  visible: Boolean,
});
const emit = defineEmits(["update:visible", "select"]);
watch(props, ({ visible }) => {
  if (!visible) {
    return;
  }
  getList();
});
const query = shallowReactive({
  pageSize: 10,
  pageIndex: 1,
});
const totalCount = shallowRef(0);

const getList = async () => {
  const result = await request("oss-get-history", query);
  totalCount.value = result.totalCount;
  list.value = result.list;
};

const list = shallowRef([]);
const gotoFile = (row) => {
  close();
  emit("select", row.path);
};
const close = () => {
  emit("update:visible", false);
};
const closed = () => {
  query.pageIndex = 1;
  list.value = [];
  totalCount.value = 0;
};
</script>
<style lang="scss" scoped>
.preview {
  width: 100px;
  height: 100px;
}
</style>
