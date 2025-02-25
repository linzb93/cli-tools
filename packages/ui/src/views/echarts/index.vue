<template>
  <el-upload :before-upload="handleChange">
    <el-button type="primary">上传图片</el-button>
  </el-upload>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, shallowRef, onMounted } from 'vue'
import request, { baseURL } from '../../helpers/request'

const handleChange = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  console.log(file)
  const res = await axios.post(baseURL + '/ai/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return false
}
</script>
<style lang="scss" scoped></style>
