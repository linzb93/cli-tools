<template>
  <el-popover :content="props.content">
    <template #reference
      ><el-icon :size="14" :color="props.color"><QuestionFilled /></el-icon
    ></template>
  </el-popover>
</template>

<script setup>
import { QuestionFilled } from "@element-plus/icons-vue";
const props = defineProps({
  content: String,
  color: {
    type: String,
    default: "#333",
  },
});
</script>
<style lang="scss" scoped></style>
