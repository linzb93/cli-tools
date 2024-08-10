<template>
  <el-dialog
    :model-value="visible"
    width="400px"
    title="错误定位"
    @close="close"
    @closed="closed"
  >
    <div class="code-wrap" v-if="loaded">
      <span>{{ code.pre }}</span>
      <em class="pre-emp-code">{{ code.preEmp }}</em>
      <em class="emphasize-code">{{ code.emphasize }}</em>
      <span>{{ code.next }}</span>
    </div>
  </el-dialog>
</template>

<script setup>
import { shallowRef, watch, reactive } from "vue";
import request from "@/helpers/request";
const props = defineProps({
  visible: Boolean,
  path: String,
});
const emit = defineEmits(["update:visible"]);

const loaded = shallowRef(false);
const code = reactive({
  pre: "",
  preEmp: "",
  emphasize: "",
  next: "",
});
watch(props, async ({ visible }) => {
  if (!visible) {
    return;
  }
  let row = 0;
  let column = 0;
  // 将定位从文件地址中分离出来
  const realPath = props.path.replace(/\:\d+\:\d+/, (match) => {
    const seg = match.split(":");
    row = Number(seg[1]);
    column = Number(seg[2]);
    return "";
  });
  const { result } = await request("fetch-api-cross-origin", {
    url: realPath,
  });
  const splitedCode = result.split("\n");
  const preCode = splitedCode[row - 1].slice(column - 100, column - 1);
  const preCodeMatch = preCode.match(/[a-zA-Z0-9]+\.$/);
  if (preCodeMatch) {
    code.preEmp = preCodeMatch[0];
  }
  code.pre = preCode.slice(0, -code.preEmp.length);
  const nextCode = splitedCode[row - 1].slice(column - 1, column + 100);
  const nextCodeMatch = nextCode.match(/^[a-zA-Z0-9]+/);
  if (nextCodeMatch) {
    code.emphasize = nextCodeMatch[0];
  }
  code.next = nextCode.slice(nextCodeMatch[0].length);
  loaded.value = true;
});

const close = () => emit("update:visible");
// 关闭后初始化
const closed = () => {
  code.pre = "";
  code.emphasize = "";
  code.preEmp = "";
  code.next = "";
};
</script>
<style lang="scss" scoped>
.code-wrap {
  background: #222;
  padding: 10px;
  border-radius: 2px;
  color: #fff;
  word-break: break-all;
}
.pre-emp-code {
  color: #e6a23c;
}
.emphasize-code {
  color: #f56c6c;
}
</style>
