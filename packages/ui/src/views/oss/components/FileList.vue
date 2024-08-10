<template>
  <p>{{ tips }}</p>
  <ul>
    <li v-for="item in list" :key="item">{{ item }}</li>
  </ul>
</template>

<script setup>
import { ref, shallowRef, reactive, shallowReactive } from "vue";
const props = defineProps({
  list: Array,
  tips: String,
});
</script>
<style lang="scss" scoped></style>
