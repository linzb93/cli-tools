import { defineStore } from "pinia";
import { handleMainPost } from "./helpers/util";
import request from "./helpers/request";

export const useGlobalStore = defineStore("oss", {
  state: () => ({
    setting: {},
    ipcIsConnect: false,
  }),
  actions: {
    saveSetting(payload: any) {
      this.setting = payload;
    },
    async getSetting() {
      if ((this.setting as any).ipc) {
        return this.setting;
      }
      this.setting = await request('get-setting', {});
    },
    listenIpcConnected() {
      handleMainPost("ipc-is-connected", (ret: boolean) => {
        this.ipcIsConnect = ret;
      });
      request("ipc-connect", {});
    },
  },
});
