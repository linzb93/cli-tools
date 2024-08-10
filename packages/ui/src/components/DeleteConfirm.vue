<template>
  <el-popover
    v-model:visible="visible"
    placement="top"
    class="confirm-pop"
    trigger="click"
  >
    <div class="confirm">
      <h3 class="title">{{ title }}</h3>
      <div class="content"><slot /></div>
      <div class="confirm-btns flexpack-end">
        <el-button @click="onCancel" size="small">取消</el-button>
        <el-button type="primary" size="small" @click="onConfirm">{{
          confirmButtonText
        }}</el-button>
      </div>
    </div>
    <template #reference>
      <el-link v-if="!hasSlot" type="danger" :underline="false" class="ml10">{{
        deleteText
      }}</el-link>
      <slot name="icon" v-else />
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";
defineProps({
  title: {
    type: String,
    default: "确认删除？",
  },
  confirmButtonText: {
    type: String,
    default: "确定",
  },
  deleteText: {
    type: String,
    default: "删除",
  },
  hasSlot: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["confirm"]);
const visible = shallowRef(false);
const onCancel = () => {
  visible.value = false;
};
const onConfirm = () => {
  visible.value = false;
  emit("confirm");
};
</script>
<style lang="scss" scoped>
.confirm {
  padding: 12px 8px 8px 15px;
  h3 {
    font-size: 14px;
    color: #333;
  }
  .content {
    font-size: 14px;
    margin-top: 10px;
    color: #666;
    :deep(span) {
      color: #ff3e40;
    }
  }
  .confirm-btns {
    margin-top: 18px;
    .el-button {
      font-size: 12px;
    }
  }
}
</style>
