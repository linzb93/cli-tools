<template>
  <el-form label-width="110px" label-suffix="：" class="mt20">
    <el-form-item>
      <template #label>
        <div class="flexalign-center">
          <el-checkbox
            :model-value="isSelectAll"
            @input="selectAll"
            label="选择应用："
          ></el-checkbox>
          <el-tooltip content="管理应用">
            <el-icon class="curp">
              <edit-pen @click="visible.apps = true" />
            </el-icon>
          </el-tooltip>
        </div>
      </template>
      <el-checkbox-group v-model="form.selected" v-if="apps.length">
        <el-checkbox v-for="app in apps" :key="app.siteId" :value="app.siteId">{{
          app.name
        }}</el-checkbox>
      </el-checkbox-group>
      <p v-else>无</p>
    </el-form-item>
    <el-form-item label="选择日期">
      <el-form-item>
        <el-radio-group :model-value="form.dateValue" @input="radioChange">
          <el-radio-button :value="0">今日</el-radio-button>
          <el-radio-button :value="1"
            >昨日<qa class="ml10" v-if="yesterdayInfo.is" :content="yesterdayInfo.content"
          /></el-radio-button>
          <el-radio-button :value="2">近7日</el-radio-button>
          <el-radio-button :value="3" class="date-picker-wrap">
            <span>自定义</span>
            <em class="contact-layer"></em>
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <div class="flexalign-center">
          <div style="white-space: nowrap">
            <el-date-picker
              ref="customerDatePickerRef"
              v-model="dateRange"
              @change="changeDate"
              type="daterange"
              placeholder="请选择日期"
              class="above"
            ></el-date-picker>
          </div>
        </div>
      </el-form-item>
      <el-button class="ml10" type="primary" @click="generate">生成</el-button>
    </el-form-item>
  </el-form>
  <el-switch
    v-if="loaded"
    v-model="hideUnimportant"
    active-text="显示不重要错误"
    inactive-text="隐藏不重要错误"
  />
  <div v-for="panel in panels" :key="panel.siteId" class="panel-wrap mt30">
    <h2>{{ panel.title }}</h2>
    <el-table :data="renderTableData(panel)" class="mt20">
      <el-table-column label="错误信息">
        <template #default="scope">
          <p :style="{ color: renderContentColor(scope.row) }">
            {{ scope.row.content }}
          </p>
        </template>
      </el-table-column>
      <el-table-column label="发生页面" prop="url" />
      <el-table-column label="浏览量" prop="errorCount" width="100" />
      <el-table-column label="影响客户数" prop="numberOfAffectedUsers" width="100" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="focusError(scope.row, panel.siteId)"
            >定位错误</el-link
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
  <app-manage v-model:visible="visible.apps" @confirm="resetSelectedApps" />
  <code-beautify
    v-model:visible="visible.code"
    :path="targetPath"
    :detail="currentItem"
    :error-msg="currentErrorMsg"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import dayjs from 'dayjs'
import { pick } from 'lodash-es'
import { ElMessage } from 'element-plus'
import { EditPen } from '@element-plus/icons-vue'
import request from '@/helpers/request'
import { service } from './utils'
import Qa from '@/components/Qa.vue'
import AppManage from './components/AppManage.vue'
import CodeBeautify from './components/CodeBeautify.vue'
import { type Application, type PanelItem, type ErrorItem, type ErrorDetailItem } from './types'

const visible = ref({
  apps: false,
  code: false
})

const getSelectedApps = async () => {
  const data = await request('bug/getApps')
  apps.value = data.list
}

onMounted(async () => {
  getSelectedApps()
  const { inited } = await request('bug/init')
  if (inited) {
    form.value.selected = apps.value.map((item) => item.siteId)
    const result = (await request('bug/getCached')) as {
      list: {
        siteId: string
        name: string
        list: ErrorItem[]
      }[]
      lastDate: string
    }
    form.value.dateValue = 3
    form.value.beginDate = result.lastDate.split(' ')[0]
    panels.value = (result.list || [])
      .map((sub) => {
        return {
          id: sub.siteId,
          siteId: sub.siteId,
          title: sub.name,
          data: sub.list
        }
      })
      .filter((item) => item.data.length)
  }
})

const resetSelectedApps = () => {
  form.value.selected = []
  getSelectedApps()
}

const apps = ref<Application[]>([])
const form = ref<{
  selected: string[]
  dateValue: number
  beginDate: string
  endDate: string
}>({
  selected: [],
  dateValue: 0,
  beginDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD')
})
const radioChange = (e: InputEvent) => {
  const value = Number((e.target as HTMLInputElement).value)
  form.value.dateValue = value
  if (value === 3) {
    return
  }

  const map = [
    [0, 0],
    [1, 1],
    [7, 0]
  ]
  form.value.beginDate = dayjs().subtract(map[value][0], 'd').format('YYYY-MM-DD')
  form.value.endDate = dayjs().subtract(map[value][1], 'd').format('YYYY-MM-DD')
}
const dateRange = computed({
  get() {
    return [form.value.beginDate, form.value.endDate]
  },
  set(value) {
    if (value) {
      form.value.beginDate = dayjs(value[0]).format('YYYY-MM-DD')
      form.value.endDate = dayjs(value[1]).format('YYYY-MM-DD')
    }
  }
})
const changeDate = (range: [string, string]) => {
  if (!range) {
    form.value.dateValue = 0
  }
  form.value.beginDate = dayjs(range[0]).format('YYYY-MM-DD')
  form.value.endDate = dayjs(range[1]).format('YYYY-MM-DD')
  form.value.dateValue = 3
}

const isSelectAll = computed(() => {
  return form.value.selected.length === apps.value.length
})
const selectAll = () => {
  if (form.value.selected.length < apps.value.length) {
    form.value.selected = apps.value.map((item) => item.siteId)
  } else {
    form.value.selected = []
  }
}

const panels = ref<PanelItem[]>([])
const generate = async () => {
  if (!form.value.selected.length) {
    ElMessage.error('请至少选择一个应用')
    return
  }
  const promiseList = form.value.selected.map((siteId) => {
    return {
      siteId,
      title: getAppName(siteId),
      action: () =>
        service.post<
          any,
          {
            list: ErrorItem[]
          }
        >('/data/analysis/jsErrorCount', {
          beginTime: `${form.value.beginDate} 00:00:00`,
          endTime: `${form.value.endDate} 23:59:59`,
          orderKey: 'errorCount',
          orderByAsc: false,
          pageIndex: 1,
          pageSize: 100,
          siteId,
          type: ['eventError', 'consoleError'],
          visitType: 0
        })
    }
  })
  const data = await Promise.all(
    promiseList.map(async (item) => {
      const result = await item.action()
      return {
        siteId: item.siteId,
        title: item.title,
        data: result.list
      }
    })
  )
  panels.value = data.filter((item) => item.data.length)
  loaded.value = true
}

const getAppName = (id: string) => {
  const match = apps.value.find((item) => item.siteId === id)
  return match ? match.name : ''
}
const loaded = ref(false)
const hideUnimportant = ref(true)
const isImportantError = (row: ErrorItem) => {
  const { content } = row
  return (
    content.startsWith('Cannot read properties of undefined') ||
    content.startsWith('Cannot read properties of null') ||
    content.includes('is not defined')
  )
}
const renderTableData = (panel: PanelItem) =>
  panel.data.filter((row) => (hideUnimportant.value ? isImportantError(row) : true))

const renderContentColor = (row: ErrorItem) => {
  const { content } = row
  if (isImportantError(row)) {
    return '#F56C6C'
  }
  if (content.startsWith('Loading chunk')) {
    return '#e1e1e1'
  }
  return ''
}
const targetPath = ref('')
const currentItem = ref<ErrorItem>()
const currentErrorMsg = ref('')
const focusError = async (row: ErrorItem, siteId: string) => {
  currentItem.value = row
  const res = await service.post<
    any,
    {
      list: ErrorDetailItem[]
    }
  >('/data/analysis/getVisitInfo', {
    ...pick(row, ['content', 'url']),
    beginTime: `${form.value.beginDate} 00:00:00`,
    endTime: `${form.value.endDate} 23:59:59`,
    pageIndex: 1,
    pageSize: 1,
    siteId,
    type: ['eventError', 'consoleError']
  })
  if (!res.list.length) {
    ElMessage.error('该错误无法定位信息')
    return
  }
  const target = res.list[0]
  const { errorMsg } = target
  if (errorMsg.startsWith('MiniProgramError')) {
    visible.value.code = true
    targetPath.value = 'MiniProgramError'
    currentErrorMsg.value = errorMsg
    return
  }
  const match = errorMsg.match(/(http.+\.js\:\d+\:\d+)/)
  if (match && match[1]) {
    visible.value.code = true
    targetPath.value = match[1]
  }
}

const yesterdayInfo = {
  is: dayjs().day() === 1,
  content: `获取的是${dayjs().subtract(3, 'd').format('YYYY-MM-DD')}~${dayjs()
    .subtract(1, 'd')
    .format('YYYY-MM-DD')}的报告`
}
</script>
<style scoped lang="scss">
.date-picker-wrap {
  position: relative !important;
  :deep(.el-date-editor) {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    width: 0;
    z-index: -1;
    padding: 0;
    .el-input__inner {
      padding: 0;
    }
  }
}
:deep(.above) {
  z-index: 1 !important;
  width: 300px;
  margin-left: 10px;
  cursor: pointer;
}
.panel-wrap {
  h2 {
    font-size: 20px;
    font-weight: bold;
  }
}
</style>
