<template>
  <p class="mb20">iPhone同步包括剪贴板同步、图片（批量）同步</p>
  <div
    class="drop-box"
    :class="{ active: active }"
    @dragover.prevent.self="active = true"
    @dragleave.prevent="active = false"
    @drop="dropFile"
    @dragleave="active = false"
  >
    <p v-if="visibleFiles.length === 0" class="center">请将需要同步的图片拖拽至此</p>
    <div class="sended-img" v-else>
      <p class="center">准备同步的图片</p>
      <el-image
        v-for="img in visibleFiles.filter((item, index) => index < max)"
        :key="img"
        :src="img"
        fit="cover"
        class="img-item"
      />
      <div class="more" v-if="visibleFiles.length > max">+{{ visibleFiles.length - max }}</div>
    </div>
  </div>
  <div class="mt20">
    <el-button type="primary" @click="startSync">同步</el-button>
    <el-button type="primary" @click="startSave">保存</el-button>
  </div>

  <el-dialog title="收到图片" v-model="visible" width="580px" @closed="closed">
    <el-image
      v-for="img in receiveList.filter((_, index) => index < max)"
      :src="img"
      class="received-image"
      draggable="true"
      fit="cover"
      @dragstart.native.stop="startDrag(img)"
    />
    <div class="more" v-if="receiveList.length > max">+{{ receiveList.length - max }}</div>
    <template #footer>
      <el-button type="primary" @click="startDownload">下载</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { shallowRef, ref } from 'vue'
import request, { baseURL } from '@/helpers/request'
import * as requestUtil from '@/helpers/request/api'
import axios from 'axios'
import { ElMessage } from 'element-plus'

/**
 * 显示的图片最大张数
 */
const max = 3

const visibleFiles = ref<string[]>([])
const active = shallowRef(false)

/**
 * 拖拽上传
 */
const dropFile = async (event: any) => {
  active.value = false
  const fList = event.dataTransfer.files
  visibleFiles.value.push(await uploadImage(fList[0]))
}

/**
 * 上传图片
 * @param file 图片文件
 */
const uploadImage = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await axios.post(baseURL + '/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return res.data.result.url
}

// iPhone批量上传图片
const receiveList = ref<string[]>([])
const visible = shallowRef(false)

// 下载
const startDownload = async () => {
  await requestUtil.download(receiveList.value)
  visible.value = false
}
const closed = () => {
  receiveList.value = []
}

/**
 * 拖拽下载
 * @param url 文件地址
 */
const startDrag = async (url: string) => {
  await request('drag', {
    url
  })
}

const startSync = async () => {
  if (!visibleFiles.value.length) {
    ElMessage.error('请先上传图片再同步')
    return
  }
  await request('/iPhone/sync', visibleFiles.value)
  ElMessage.success('上传成功，等待同步')
}
const startSave = async () => {
  try {
    await request('/iPhone/save')
  } catch (error) {
    ElMessage.error('没有图片可以保存')
  }
}
</script>
<style lang="scss" scoped>
.drop-box {
  width: 580px;
  height: 300px;
  border: 1px solid #999;
  border-radius: 4px;
  padding: 10px;
  position: relative;
  &.active {
    &:after {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      right: 0;
      z-index: 2;
      content: '';
      background: rgb(64, 158, 255, 0.4);
    }
    & > p {
      position: relative;
      z-index: 3;
    }
  }
  .center {
    text-align: center;
  }
}
.received-image {
  width: 120px;
  height: 120px;
  border-radius: 2px;
  margin-right: 10px;
}
.sended-img {
  .img-item {
    width: 120px;
    height: 120px;
    border-radius: 2px;
    margin-left: 10px;
    &:first-child {
      margin-left: 0;
    }
  }
}
.more {
  display: inline-block;
  vertical-align: top;
  width: 120px;
  height: 120px;
  border-radius: 2px;
  margin-left: 10px;
  line-height: 120px;
  text-align: center;
  background: #eee;
  font-size: 40px;
  color: #ddd;
}
</style>
