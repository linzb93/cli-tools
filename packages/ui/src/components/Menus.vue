<template>
  <div class="menu-list full-height">
    <div class="top-btn flexpack-end">
      <router-link to="/setting"
        ><el-icon class="sub-btn curp" title="设置"><Setting /></el-icon
      ></router-link>
      <el-icon
        @click="startSync"
        class="sub-btn curp"
        title="同步"
        :class="{ loading: syncing }"
      >
        <Refresh />
      </el-icon>
    </div>
    <ul>
      <li
        v-for="menu in menuList"
        :key="menu.title"
        :class="{ active: isActive(menu) }"
      >
        <div class="flexalign-center" @click="jump(menu)">
          <el-icon class="pre-icon">
            <component :is="menu.icon" />
          </el-icon>
          <span>{{ menu.title }}</span>
        </div>
      </li>
    </ul>
  </div>
  <el-dialog v-model="visible" title="登录" width="400px">
    <el-form
      label-suffix="："
      label-width="70px"
      :model="account"
      :rules="rules"
      ref="accountRef"
    >
      <el-form-item label="账号">
        <el-input v-model="account.user" placeholder="请输入账号" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input
          v-model="account.password"
          type="password"
          placeholder="请输入密码"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { shallowReactive, ref, shallowRef } from "vue";
import { ElMessage } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import {
  Refresh,
  Iphone,
  HomeFilled,
  Setting,
  View,
  Clock,
} from "@element-plus/icons-vue";
import { Oss } from "./icons";
import request from "@/helpers/request";

const route = useRoute();
const router = useRouter();

const list = [
  {
    title: "首页",
    to: "/",
    icon: HomeFilled,
  },
  {
    title: "阿里OSS",
    to: "/oss",
    icon: Oss,
  },
  {
    title: "iPhone同步",
    to: "/iPhone",
    icon: Iphone,
  },
  {
    title: "监控系统",
    to: "/monitor",
    icon: View,
  },
  {
    title: "Git扫描",
    to: "/git",
    icon: Clock,
  },
];
const menuList = list.filter((item) => !item.hide);
const isActive = (menu) => {
  if (route.path === "/") {
    return menu.to === "/";
  }
  return route.path.startsWith(menu.to) && menu.to !== "/";
};

// 同步
const syncing = shallowRef(false);
const visible = shallowRef(false);
const account = shallowReactive({
  user: "",
  password: "",
});
const rules = {
  user: { required: true, message: "请输入账号" },
  password: { required: true, message: "请输入密码" },
};
const accountRef = ref(null);
const startSync = async () => {
  syncing.value = true;
  const result = await request("sync");
  if (!result.success) {
    // 未登录账号
    visible.value = true;
  }
  syncing.value = false;
};
const jump = (item) => {
  if (item.unpublished) {
    ElMessage.warning("正在开发中，敬请期待");
    return;
  }
  router.push(item.to);
};
const save = () => {
  accountRef.value.validate(async (isValid) => {
    if (!isValid) {
      return;
    }
    await request("login", ...account);
    ElMessage.success("登录成功");
    syncing.value = true;
    await request("sync");
    syncing.value = false;
  });
};
</script>
<style lang="scss" scoped>
.top-btn {
  margin: 0 10px 10px 0;
  .sub-btn {
    font-size: 16px;
    color: #fff;
    margin-left: 10px;
  }
}
.loading {
  animation: rotate 1.2s linear infinite;
}
.menu-list {
  width: 200px;
  padding-top: 20px;
  background: #3f4156;
  padding-bottom: 20px;
  li {
    padding: 0 10px;
    line-height: 2;
    color: #e9eaf2;
    font-size: 16px;
    cursor: pointer;
    &:first-child {
      margin-top: 0;
    }
    &:hover,
    &.active {
      background-color: lighten(#3f4156, 5%);
    }
    a {
      color: inherit;
    }
  }
  .pre-icon {
    margin-right: 5px;
  }
}
</style>
