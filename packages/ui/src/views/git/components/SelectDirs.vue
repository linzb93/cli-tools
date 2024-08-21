<template>
  <div>
    <el-button type="primary" @click="selectDirs">添加目录</el-button>
    <ul>
      <li v-for="item in props.dirs" :key="item.path" class="flexalign-center">
        <span class="path"
          >{{ item.path }}<em class="ml10"> ({{ item.name }})</em></span
        >
        <el-icon title="编辑" :size="14" class="curp ml10" @click="edit(item)"><EditPen /></el-icon>
        <el-icon
          title="打开文件夹"
          :size="14"
          class="curp ml10"
          @click="
            requestUtil.open({
              type: 'path',
              url: item.path
            })
          "
        >
          <Folder />
        </el-icon>
        <delete-confirm has-slot @confirm="onDelete(item)">
          <template #icon>
            <el-icon title="删除" :size="14" class="curp ml10"><Delete /></el-icon>
          </template>
        </delete-confirm>
      </li>
    </ul>
  </div>
  <el-dialog v-model="visible" title="修改项目信息" width="300">
    <p>路径：{{ currentItem.path }}</p>
    <p>名称：<el-input v-model="currentItem.name" style="width: 200px" /></p>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button @click="save" type="primary">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, shallowRef } from 'vue'
import { clone } from 'lodash-es'
import { ElMessage } from 'element-plus'
import { EditPen, Delete, Folder } from '@element-plus/icons-vue'
import pathUtil from '@/helpers/path'
import request from '@/helpers/request'
import * as requestUtil from '@/helpers/request/api'
import DeleteConfirm from '@/components/DeleteConfirm.vue'

const props = defineProps({
  dirs: {
    type: Array,
    default: () => {
      return []
    }
  }
})
const emit = defineEmits(['update:dirs'])

// 编辑
const currentItem = ref({})
const visible = shallowRef(false)
const edit = (item) => {
  currentItem.value = clone(item)
  visible.value = true
}
// 保存
const save = () => {
  emit(
    'update:dirs',
    props.dirs.map((dir) => {
      if (dir.path === currentItem.value.path) {
        return {
          path: dir.path,
          name: currentItem.value.name
        }
      }
      return dir
    })
  )
  ElMessage.success('保存成功')
  visible.value = false
}

// 删除
const onDelete = (item) => {
  emit(
    'update:dirs',
    props.dirs.filter((dir) => dir.path !== item.path)
  )
  ElMessage.success('删除成功')
}
const selectDirs = async () => {
  const { path } = await request('/getDirectoryPath')
  emit('update:dirs', [
    ...props.dirs,
    {
      path,
      name: pathUtil.basename(path)
    }
  ])
}
</script>
<style lang="scss" scoped>
li {
  em {
    color: #999;
  }
}
</style>
