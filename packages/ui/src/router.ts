import { createRouter, createWebHashHistory } from 'vue-router';

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
  },
  {
    path: '/awesome',
    component: () => import('./views/awesome/index.vue')
  },
  {
    path: '/ai-models',
    component: () => import('./views/ai-models/index.vue')
  }
];

export default createRouter({
  history: createWebHashHistory(),
  routes
});
