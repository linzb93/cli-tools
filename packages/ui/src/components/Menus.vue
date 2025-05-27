<template>
  <div class="menu-list full-height">
    <div class="top-btn flexpack-end">
      <router-link to="/setting"
        ><el-icon class="sub-btn curp" title="设置"><Setting /></el-icon
      ></router-link>
    </div>
    <ul>
      <li v-for="menu in menuList" :key="menu.title" :class="{ active: isActive(menu) }">
        <div class="flexalign-center" @click="jump(menu)">
          <el-icon class="pre-icon">
            <component :is="menu.icon" />
          </el-icon>
          <span>{{ menu.title }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { shallowReactive, ref, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import { omit } from 'lodash-es'
import { useRoute, useRouter } from 'vue-router'
import { Refresh, HomeFilled, Setting, View, Clock } from '@element-plus/icons-vue'
import request from '@/helpers/request'

const route = useRoute()
const router = useRouter()

interface Menu {
  title: string
  to: string
  icon: any
}

const list: Menu[] = [
  {
    title: '首页',
    to: '/',
    icon: HomeFilled
  },
  {
    title: '监控系统',
    to: '/monitor',
    icon: View
  },
  {
    title: '代理',
    to: '/agent',
    icon: Clock
  }
]
const menuList = list
const isActive = (menu: Menu) => {
  if (route.path === '/') {
    return menu.to === '/'
  }
  return route.path.startsWith(menu.to) && menu.to !== '/'
}

const jump = (item: Menu) => {
  router.push(item.to)
}
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
