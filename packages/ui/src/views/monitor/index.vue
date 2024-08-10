<template>
  <div>
    <div>
      <el-button type="primary" @click="visible.apps = true"
        >管理应用</el-button
      >
    </div>
    <el-form label-width="110px" label-suffix="：" class="mt20">
      <el-form-item label="选择应用">
        <template #label>
          <el-checkbox
            :model-value="isSelectAll"
            @input="selectAll"
            label="选择应用："
          ></el-checkbox>
        </template>
        <el-checkbox-group v-model="form.selected" v-if="apps.length">
          <el-checkbox
            v-for="app in apps"
            :key="app.siteId"
            :value="app.siteId"
            >{{ app.name }}</el-checkbox
          >
        </el-checkbox-group>
        <p v-else>无</p>
      </el-form-item>
      <el-form-item label="选择日期">
        <el-radio-group v-model="form.dateValue" @change="radioChange">
          <el-radio-button :value="0">今日</el-radio-button>
          <el-radio-button :value="1"
            >昨日<qa
              class="ml10"
              v-if="yesterdayInfo.is"
              :content="yesterdayInfo.content"
          /></el-radio-button>
          <el-radio-button :value="2">近7日</el-radio-button>
          <el-radio-button :value="3" class="date-picker-wrap">
            <span>自定义</span>
            <em class="contact-layer"></em>
            <el-date-picker
              ref="customerDatePicker"
              v-model="form.range"
              @change="changeDate"
              type="daterange"
              placeholder="请选择日期"
              class="above"
            ></el-date-picker>
          </el-radio-button>
        </el-radio-group>
        <span class="ml10">{{ dateRange }}</span>
      </el-form-item>
      <el-button type="primary" @click="generate">生成</el-button>
    </el-form>
    <div>
      <div v-for="panel in panels" :key="panel.id" class="panel-wrap mt30">
        <h2>{{ panel.title }}</h2>
        <el-table :data="panel.data" class="mt20">
          <el-table-column label="错误信息">
            <template #default="scope">
              <p :style="{ color: renderContentColor(scope.row) }">
                {{ scope.row.content }}
              </p>
            </template>
          </el-table-column>
          <el-table-column label="发生页面" prop="url" />
          <el-table-column label="浏览量" prop="errorCount" width="100" />
          <el-table-column
            label="影响客户数"
            prop="numberOfAffectedUsers"
            width="100"
          />
          <el-table-column label="操作">
            <template #default="scope">
              <el-link
                type="primary"
                :underline="false"
                @click="focusError(scope.row, panel.siteId)"
                >定位错误</el-link
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
  <app-manage v-model:visible="visible.apps" @confirm="resetSelectedApps" />
  <code-beautify v-model:visible="visible.code" :path="targetPath" />
</template>

<script setup>
import {
  reactive,
  shallowRef,
  shallowReactive,
  ref,
  onMounted,
  computed,
} from "vue";
import dayjs from "dayjs";
import { pick } from "lodash-es";
import pMap from "p-map";
import { ElMessage } from "element-plus";
import request from "@/helpers/request";
import { service } from "./utils";
import Qa from "@/components/Qa.vue";
import AppManage from "./components/AppManage.vue";
import CodeBeautify from "./components/CodeBeautify.vue";
const visible = shallowReactive({
  apps: false,
  code: false,
});

const getSelectedApps = async () => {
  const data = await request("monitor-get-apps");
  apps.value = data.list;
};
onMounted(() => {
  getSelectedApps();
});

const resetSelectedApps = () => {
  form.selected = [];
  getSelectedApps();
};

const apps = ref([]);
const form = reactive({
  selected: [],
  dateValue: 0,
  beginDate: dayjs().format("YYYY-MM-DD"),
  endDate: dayjs().format("YYYY-MM-DD"),
  range: [],
});

const dateRange = computed(() => {
  if (form.beginDate === form.endDate) {
    return form.beginDate;
  }
  return `${form.beginDate}~${form.endDate}`;
});

const customerDatePicker = ref(null);
const radioChange = (value) => {
  if (value === 3) {
    customerDatePicker.value.focus();
  } else {
    typeof customerDatePicker.value.blur === "function" &&
      customerDatePicker.value.blur();
    const map = [
      [0, 0],
      [1, 1],
      [7, 0],
    ];
    form.beginDate = dayjs().subtract(map[value][0], "d").format("YYYY-MM-DD");
    form.endDate = dayjs().subtract(map[value][1], "d").format("YYYY-MM-DD");
  }
};
const changeDate = (range) => {
  form.beginDate = dayjs(range[0]).format("YYYY-MM-DD");
  form.endDate = dayjs(range[1]).format("YYYY-MM-DD");
};

const isSelectAll = computed(() => {
  return form.selected.length === apps.value.length;
});
const selectAll = () => {
  if (form.selected.length < apps.value.length) {
    form.selected = apps.value.map((item) => item.siteId);
  } else {
    form.selected = [];
  }
};

const panels = ref([]);
const generate = async () => {
  if (!form.selected.length) {
    ElMessage.error("请至少选择一个应用");
    return;
  }
  const promiseList = form.selected.map((siteId) => {
    return {
      siteId,
      title: getAppName(siteId),
      action: () =>
        service.post("/data/analysis/jsErrorCount", {
          beginTime: `${form.beginDate} 00:00:00`,
          endTime: `${form.endDate} 23:59:59`,
          orderKey: "errorCount",
          orderByAsc: false,
          pageIndex: 1,
          pageSize: 100,
          siteId,
          type: ["eventError", "consoleError"],
          visitType: 0,
        }),
    };
  });
  const data = await pMap(promiseList, async (item) => {
    const result = await item.action();
    return {
      siteId: item.siteId,
      title: item.title,
      data: result.list,
    };
  });
  panels.value = data;
};
const getAppName = (id) => {
  const match = apps.value.find((item) => item.siteId === id);
  return match ? match.name : "";
};
const renderContentColor = (row) => {
  const { content } = row;
  if (content.startsWith("Cannot read properties of undefined")) {
    return "#F56C6C";
  }
  if (content.startsWith("Loading chunk")) {
    return "#e1e1e1";
  }
  return "";
};
const targetPath = shallowRef("");
const focusError = async (row, siteId) => {
  const res = await service.post("/data/analysis/getVisitInfo", {
    ...pick(row, ["content", "url"]),
    beginTime: `${form.beginDate} 00:00:00`,
    endTime: `${form.endDate} 23:59:59`,
    pageIndex: 1,
    pageSize: 1,
    siteId,
    type: ["eventError", "consoleError"],
  });
  const target = res.list[0];
  const { errorMsg } = target;
  const match = errorMsg.match(/(http.+\.js\:\d+\:\d+)/);
  if (match && match[1]) {
    visible.code = true;
    targetPath.value = match[1];
  }
  // TODO:取错误定位前200个字符，后100个字符。去掉无用的代码，然后格式化，定位改成用箭头指示。
};

const yesterdayInfo = {
  is: dayjs().day() === 1,
  content: `获取的是${dayjs().subtract(3, "d").format("YYYY-MM-DD")}~${dayjs()
    .subtract(1, "d")
    .format("YYYY-MM-DD")}的报告`,
};
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
  width: 100% !important;
  cursor: pointer;
}
.panel-wrap {
  h2 {
    font-size: 20px;
    font-weight: bold;
  }
}
</style>
