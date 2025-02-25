import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('./views/home/index.vue')
  },
  {
    path: '/iPhone',
    component: () => import('./views/iPhone/index.vue')
  },
  {
    path: '/monitor',
    component: () => import('./views/monitor/index.vue')
  },
  {
    path: '/git',
    component: () => import('./views/git/index.vue')
  },
  {
    path: '/echarts',
    component: () => import('./views/echarts/index.vue')
  },
  // {
  //   path: '/vue',
  //   component: () => import('./views/vue/index.vue')
  // },
  // {
  //   path: '/agent',
  //   component: () => import('./views/agent/index.vue')
  // },
  {
    path: '/setting',
    component: () => import('./views/setting/index.vue')
  }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
