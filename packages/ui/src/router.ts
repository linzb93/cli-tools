import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('./views/home/index.vue')
  },
  {
    path: '/monitor',
    component: () => import('./views/monitor/index.vue')
  },
  {
    path: '/agent',
    component: () => import('./views/agent/index.vue')
  }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
