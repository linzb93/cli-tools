<template>
  <el-dialog :model-value="visible" width="400px" title="错误定位" @close="close" @closed="closed">
    <p class="mb20">错误地址：{{ detail?.url }}</p>
    <template v-if="!isMinip">
      <el-switch
        active-text="增加代码定位范围"
        inactive-text="恢复代码定位范围"
        v-model="includeRange"
      />
      <div class="code-wrap mt10" v-if="loaded">
        <span>{{ code.pre }}</span>
        <em class="pre-emp-code">{{ code.preEmp }}</em>
        <em class="emphasize-code">{{ code.emphasize }}</em>
        <span>{{ code.next }}</span>
      </div>
    </template>
    <div v-else class="pre">{{ errorMsg }}</div>
  </el-dialog>
</template>

<script setup lang="ts">
import { shallowRef, ref, watch, reactive, computed } from 'vue'
import request from '@/helpers/request'
import { type ErrorItem } from '../types'
const props = defineProps({
  path: String,
  errorMsg: String,
  detail: Object as () => ErrorItem
})
const emit = defineEmits(['update:visible'])

const visible = defineModel('visible', {
  type: Boolean,
  default: false
})
const includeRange = shallowRef(false)
const loaded = shallowRef(false)
const code = reactive({
  pre: '',
  preEmp: '',
  emphasize: '',
  next: ''
})
const isMinip = ref(false)
watch(visible, async (vis) => {
  if (!vis) {
    return
  }
  let row = 0
  let column = 0
  // 将定位从文件地址中分离出来
  const { path } = props
  if (path === 'MiniProgramError') {
    isMinip.value = true
    return
  }
  const realPath = path
    ? path.replace(/\:\d+\:\d+/, (match) => {
        const seg = match.split(':')
        row = Number(seg[1])
        column = Number(seg[2])
        return ''
      })
    : ''
  const result = await request('/common/fetchApiCrossOrigin', {
    url: realPath
  })
  const range = computed(() => {
    return includeRange.value ? 200 : 100
  })
  watch(
    range,
    () => {
      const splitedCode = result.split('\n')
      const preCode = splitedCode[row - 1].slice(column - range.value, column - 1)
      const preCodeMatch = preCode.match(/[a-zA-Z0-9]+\.$/)
      if (preCodeMatch) {
        code.preEmp = preCodeMatch[0]
      } else {
        code.preEmp = preCode
      }
      code.pre = preCode.slice(0, -code.preEmp.length)
      const nextCode = splitedCode[row - 1].slice(column - 1, column + range.value)
      const nextCodeMatch = nextCode.match(/^[a-zA-Z0-9]+/)
      if (nextCodeMatch) {
        code.emphasize = nextCodeMatch[0]
        code.next = nextCode.slice(nextCodeMatch[0].length)
      } else {
        code.next = nextCode
      }
      loaded.value = true
    },
    {
      immediate: true
    }
  )
})

const close = () => (visible.value = false)
// 关闭后初始化
const closed = () => {
  code.pre = ''
  code.emphasize = ''
  code.preEmp = ''
  code.next = ''
}
</script>
<style lang="scss" scoped>
.code-wrap {
  background: #222;
  padding: 10px;
  border-radius: 2px;
  color: #fff;
  word-break: break-all;
}
.pre {
  font-size: 14px;
  white-space: pre-wrap;
}
.pre-emp-code {
  color: #e6a23c;
}
.emphasize-code {
  color: #f56c6c;
}
</style>
