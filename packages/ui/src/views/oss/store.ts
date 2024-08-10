import { defineStore } from "pinia";

export const useOssStore = defineStore("oss", {
  state: () => ({
    platform: {},
  }),
  actions: {
    savePlatform(payload: any) {
      this.platform = payload;
    },
  },
});
