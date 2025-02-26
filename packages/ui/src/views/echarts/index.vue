<template>
  <el-upload :before-upload="handleChange">
    <el-button type="primary">上传图片</el-button>
  </el-upload>
  <div class="charts" id="charts"></div>
</template>

<script setup lang="ts">
import { ElLoading } from 'element-plus'
import axios from 'axios'
import * as echarts from 'echarts'
import { baseURL } from '../../helpers/request'
let loadingInstance: any
const handleChange = async (file) => {
  const formData = new FormData()
  loadingInstance = ElLoading.service({ fullscreen: true, text: '正在生成' })
  formData.append('file', file)
  const res = (await axios.post(baseURL + '/ai/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })) as any
  if (res.data.success) {
    renderChart(res.data.options)
  }
  return false
}

const renderChart = async (data: any) => {
  const myChart = echarts.init(document.getElementById('charts'))
  myChart.setOption(data)
  loadingInstance.close()
}
</script>
<style lang="scss" scoped>
.charts {
  width: 1000px;
  height: 300px;
}
</style>
