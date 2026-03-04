<template>
  <div class="home">
    <h1>工具箱</h1>
    <div class="menu-container">
      <div v-for="menu in menuList" :key="menu.title" class="menu-item" @click="jump(menu)">
        <el-icon class="menu-icon">
          <component :is="menu.icon" />
        </el-icon>
        <span class="menu-title">{{ menu.title }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { View, Clock } from '@element-plus/icons-vue'

const router = useRouter()

/**
 * 菜单项接口定义
 */
interface Menu {
  title: string
  to: string
  icon: any
}

/**
 * 菜单列表，移除了“首页”
 */
const menuList: Menu[] = [
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

/**
 * 跳转到指定菜单
 * @param item 菜单项
 */
const jump = (item: Menu) => {
  router.push(item.to)
}
</script>

<style scoped lang="scss">
.home {
  text-align: center;
  padding-top: 100px;
  h1 {
    margin-bottom: 60px;
    font-size: 36px;
    font-weight: bold;
    color: #333;
  }
}

.menu-container {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.menu-item {
  width: 200px;
  height: 120px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f0f0f0;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
    border-color: #409eff;
    
    .menu-icon {
      color: #409eff;
      transform: scale(1.1);
    }
    
    .menu-title {
      color: #409eff;
      font-weight: 600;
    }
  }

  .menu-icon {
    font-size: 32px;
    margin-bottom: 12px;
    color: #606266;
    transition: all 0.3s;
  }

  .menu-title {
    font-size: 18px;
    color: #303133;
    transition: all 0.3s;
  }
}
</style>
