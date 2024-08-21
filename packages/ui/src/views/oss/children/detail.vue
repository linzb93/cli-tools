<template>
  <div
    class="wrap"
    :class="{ active: active }"
    @dragover.prevent="setDragState(true)"
    @drop="dropFile"
  >
    <div class="layer flex-center" @keyup="setDragState(false)">
      <p class="tips">请将需要上传的文件拖拽至此</p>
    </div>
    <div class="flexalign-center">
      <el-button type="primary" @click="createDir">创建文件夹</el-button>
      <el-button type="primary" @click="visible.setting = true">设置</el-button>
      <template v-if="selected.length">
        <el-button type="danger" @click="deleteMulti">批量删除</el-button>
        <el-button type="primary" @click="downloadMulti">批量下载</el-button>
      </template>
      <el-button type="primary" @click="visible.history = true">上传历史</el-button>
      <div class="path ml20 flexalign-center">
        <template v-if="breadcrumb.length">
          <el-icon @click="clickPath(-1)" class="curp" :size="16">
            <home-filled />
          </el-icon>
          <el-icon class="mr10" :size="16">
            <arrow-right />
          </el-icon>
        </template>
        <div
          class="path-item flexalign-center curp"
          v-for="(item, index) in breadcrumb"
          :key="item"
          @click="clickPath(index)"
        >
          <el-icon :size="16">
            <folder />
          </el-icon>
          <span class="path-name">{{ item }}</span>
          <el-icon v-if="index < breadcrumb.length - 1">
            <arrow-right />
          </el-icon>
        </div>
      </div>
    </div>
    <div class="other-wrap">
      <context-menu
        :menus="[
          {
            title: '创建文件夹',
            onClick() {
              createDir()
            }
          }
        ]"
      >
        <el-table :data="tableList" v-loading="loading" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column label="名称">
            <template #default="scope">
              <div class="flexalign-center">
                <el-icon v-if="scope.row.type === 'dir'" :size="16" style="margin-right: 5px">
                  <folder />
                </el-icon>
                <file-type-icon :type="pathUtil.extname(scope.row.name)" v-else />
                <span class="file-name" @click="jumpInner(scope.row)">{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="预览图" v-if="setting.previewType === 2">
            <template #default="scope">
              <img
                v-if="isPic(scope.row)"
                class="table-preview-img curp"
                :src="scope.row.url"
                @click="jumpInner(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="类型/大小">
            <template #default="scope">
              <template v-if="scope.row.type === 'dir'">目录</template>
              <template v-else>{{ getSize(scope.row) }}</template>
            </template>
          </el-table-column>
          <el-table-column label="最后修改时间">
            <template #default="scope">
              {{
                scope.row.type === 'dir'
                  ? ''
                  : dayjs(scope.row.lastModified).format('YYYY-MM-DD HH:mm:ss')
              }}
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <template v-if="scope.row.type !== 'dir'">
                <el-link type="primary" :underline="false" @click="requestUtil.copy(scope.row.url)"
                  >获取地址</el-link
                >
                <el-link
                  type="primary"
                  :underline="false"
                  @click="requestUtil.download(scope.row.url)"
                  >下载</el-link
                >
                <el-link
                  type="primary"
                  :underline="false"
                  v-if="isPic(scope.row)"
                  @click="getCss(scope.row)"
                  >复制样式</el-link
                >
              </template>
              <delete-confirm @confirm="del(scope.row)"></delete-confirm>
            </template>
          </el-table-column>
        </el-table>
      </context-menu>
    </div>
  </div>
  <upload-history v-model:visible="visible.history" @select="onSelectHistory" />
  <progress-drawer
    v-model:visible="progressVisible"
    :upload-list="uploadingList"
    :path="fullPath"
    @refresh="getList"
  />
  <setting-dialog v-model:visible="visible.setting" @submit="(data) => (setting = data)" />
  <el-dialog v-model="visible.preview" title="图片预览" :width="`450px`">
    <div class="center">
      <img :src="previewUrl" class="img-dialog-preview" />
    </div>
    <template #footer>
      <el-button
        type="primary"
        @click="
          requestUtil.open({
            type: 'web',
            url: previewUrl
          })
        "
        >在浏览器打开</el-button
      >
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, shallowRef, shallowReactive, onMounted, computed, h } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { Folder, ArrowRight, HomeFilled } from '@element-plus/icons-vue'
import { getSize } from '../util'
import useUpload from '../hooks/useUpload'
import pathUtil from '@/helpers/path'
import { scrollTo } from '@/helpers/scroll-to'
import request from '@/helpers/request'
import * as requestUtil from '@/helpers/request/api'
import FileTypeIcon from '@/components/FileTypeIcon.vue'
import DeleteConfirm from '@/components/DeleteConfirm.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import ProgressDrawer from '../components/Progress.vue'
import MsgBoxFileList from '../components/FileList.vue'
import SettingDialog from '../components/Setting.vue'
import UploadHistory from '../components/UploadHistory.vue'

const route = useRoute()

const tableList = shallowRef([])
const breadcrumb = ref([])
const fullPath = computed(() => breadcrumb.value.map((item) => `${item}/`).join(''))
const visible = shallowReactive({
  progress: false,
  preview: false,
  setting: false,
  history: false
})
const loading = shallowRef(true)
loading.value = true

// 获取文件列表
const getList = async () => {
  const data = await request('/oss/getFileList', {
    id: Number(route.query.id),
    config: {
      prefix: fullPath.value
    }
  })
  loading.value = false
  tableList.value = data.list
  scrollTo(0, 800)
}
onMounted(async () => {
  const { shortcut } = await request('/oss/getShortcut', {
    id: Number(route.query.id)
  })
  if (shortcut) {
    breadcrumb.value.push(shortcut)
  }
  getList()
})

// 点击面包屑
const clickPath = (index) => {
  breadcrumb.value = breadcrumb.value.slice(0, index + 1)
  getList()
}

// 多选
const selected = shallowRef([])
const handleSelectionChange = (selection) => {
  if (selection.every((item) => item.type !== 'dir')) {
    selected.value = selection
  }
}

// 删除文件
const del = async (item) => {
  const name = item.type === 'dir' ? `${item.name}/` : item.name
  await request('/oss/deleteFile', {
    id: Number(route.query.id),
    path: `${fullPath.value}${name}`
  })
  ElMessage.success('删除成功')
  getList()
}

// 批量删除
const deleteMulti = () => {
  ElMessageBox({
    message: h(MsgBoxFileList, {
      list: selected.value.map((item) => item.name),
      tips: '确认删除以下文件：'
    }),
    title: '温馨提醒',
    showCancelButton: true,
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  }).then(async () => {
    await request('/oss/deleteFile', {
      id: Number(route.query.id),
      paths: selected.value.map((item) => `${fullPath.value}${item.name}`)
    })
    ElMessage.success('删除成功')
    selected.value = []
    getList()
  })
}

// 图片预览
const previewUrl = shallowRef('')
const isPic = (item) => {
  return ['jpg', 'png', 'gif'].includes(pathUtil.extname(item.name))
}
// 进入文件夹内层
const jumpInner = (item) => {
  if (item.size > 0) {
    // 是图片
    if (isPic(item)) {
      previewUrl.value = item.url
      visible.preview = true
    }
    return
  }
  breadcrumb.value.push(item.name)
  getList()
}

// 批量下载
const downloadMulti = async () => {
  await requestUtil.download(selected.value.map((item) => item.url))
  selected.value = []
}

// 创建文件夹
const createDir = () => {
  ElMessageBox.prompt('请输入文件夹名称', '温馨提醒', {
    confirmButtonText: '创建'
  })
    .then(async ({ value }) => {
      if (!value) {
        ElMessage.error('请输入文件夹名称')
        return
      }
      if (tableList.value.some((file) => file.type === 'dir' && file.name === value)) {
        ElMessage.warning('存在同名文件夹，无需创建')
        return
      }
      await request('/oss/createDirectory', {
        id: Number(route.query.id),
        path: fullPath.value,
        name: value
      })
      ElMessage.success('创建成功')
      getList()
    })
    .catch(() => {
      //
    })
}

const onSelectHistory = (filePath) => {
  const { pathname } = new URL(filePath)
  breadcrumb.value = pathname.split('/').slice(1, -1)
  getList()
}
// 拖拽上传

const {
  visible: progressVisible,
  active,
  setDragState,
  dropFile,
  uploadingList
} = useUpload(tableList.value)

const setting = shallowRef({
  pixel: 2,
  platform: 1,
  previewType: 1
})
const getCss = (item) => {
  const img = new Image()
  img.src = item.url
  img.onload = function () {
    const { width, height } = this
    const widthData = setting.value.pixel === 2 ? parseInt(width / 2) : width
    const heightData = setting.value.pixel === 2 ? parseInt(height / 2) : height
    const text = `width: ${setting.value.platform === 1 ? `rem(${widthData})` : `${widthData}px`};
    height: ${setting.value.platform === 1 ? `rem(${heightData})` : `${heightData}px`};
    background-image: url(${item.url});
    background-size: 100% 100%;`
    requestUtil.copy(text)
  }
}
</script>
<style lang="scss" scoped>
@import '@/styles/mixin.scss';
.el-link + .el-link {
  margin-left: 10px;
}
.path {
  white-space: nowrap;
}
.path-name {
  margin-left: 4px;
}
.file-name {
  cursor: pointer;
  &:hover {
    color: #409eff;
  }
}
.other-wrap {
  position: absolute;
  top: 42px;
  bottom: 10px;
  left: 0;
  width: 100%;
}
.wrap {
  min-height: 100%;
  position: relative;
  &.active {
    .layer {
      display: flex;
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      right: 0;
      z-index: 4;
      background: rgba(255, 255, 100, 0.7);
    }
    .tips {
      display: block;
      text-align: center;
      font-size: 20px;
      font-weight: bold;
    }
  }
  .layer {
    display: none;
    pointer-events: none;
  }
  .tips {
    display: none;
  }
}
.center {
  text-align: center;
}
.img-dialog-preview {
  max-width: 400px;
}
.table-preview-img {
  max-width: 100px;
}
</style>
