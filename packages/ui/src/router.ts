import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  {
    path: "/",
    component: () => import("./views/home/index.vue"),
  },
  {
    path: "/oss",
    component: () => import("./views/oss/index.vue"),
  },
  {
    path: "/oss/detail",
    component: () => import("./views/oss/children/detail.vue"),
  },
  {
    path: "/iPhone",
    component: () => import("./views/iPhone/index.vue"),
  },
  {
    path: "/monitor",
    component: () => import("./views/monitor/index.vue"),
  },
  {
    path: "/git",
    component: () => import("./views/git/index.vue"),
  },
  {
    path: "/setting",
    component: () => import("./views/setting/index.vue"),
  },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
