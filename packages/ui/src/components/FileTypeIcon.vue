<template>
  <el-icon :size="16" style="margin-right: 5px">
    <component :is="map[getExtIcon(type)]" />
  </el-icon>
</template>

<script setup>
import {
  VueIcon,
  Css,
  Html,
  Js,
  File,
  Json,
  Jsx,
  Markdown,
  Pic,
  Scss,
  Svg,
  Txt,
  Typescript,
  Video,
  Zip,
  Mp3,
  Excel,
  Font,
  App,
} from "./icons";
const props = defineProps({
  type: String,
});
const map = {
  app: App,
  html: Html,
  css: Css,
  js: Js,
  json: Json,
  md: Markdown,
  jsx: Jsx,
  img: Pic,
  vue: VueIcon,
  scss: Scss,
  svg: Svg,
  txt: Txt,
  ts: Typescript,
  font: Font,
  video: Video,
  mp3: Mp3,
  file: File,
  zip: Zip,
  excel: Excel,
};

// 获取文件图标
const getExtIcon = (extName) => {
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(extName)) {
    return "img";
  }
  if (["mp4", "wav", "avi", "mpeg", "mov", "flv", "m4a"].includes(extName)) {
    return "video";
  }
  if (
    [
      "html",
      "css",
      "js",
      "vue",
      "md",
      "jsx",
      "vue",
      "scss",
      "svg",
      "txt",
      "ts",
      "mp3",
    ].includes(extName)
  ) {
    return extName;
  }
  if (["apk", "ipa"].includes(extName)) {
    return "app";
  }
  if (["json", "yml"].includes(extName)) {
    return "json";
  }
  if (["rar", "zip", "7z", "exe"].includes(extName)) {
    return "zip";
  }
  if (extName.startsWith("json")) {
    return "json";
  }
  if (["sass", "less"].includes(extName)) {
    return "scss";
  }
  if (["xls", "xlsx", "csv"].includes(extName)) {
    return "excel";
  }
  if (extName === "tsx") {
    return "jsx";
  }
  if (["ttf", "woff"].includes(extName)) {
    return "font";
  }
  return "file";
};
</script>
<style lang="scss" scoped>
.file-icon {
  width: 20px;
  height: 16px;
  display: inline-block;
  vertical-align: middle;
}
</style>
