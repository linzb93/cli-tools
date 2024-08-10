import { ElLoading } from "element-plus";

/**
 * 处理来自主进程的请求
 * @param receiveMethod 请求名称 
 * @param callback 回调函数
 */
export const handleMainPost = (receiveMethod: string, callback: Function) => {
  window.ipcRenderer.on(
    "main-post",
    async (_, { requestId, method, data, listener }) => {
      console.groupCollapsed(
        `收到来自主进程发起的请求：%c${receiveMethod}`,
        "color:orange"
      );
      console.log(data);
      console.groupEnd();
      if (method !== receiveMethod) {
        return;
      }
      const ret = await callback(data);
      if (listener) {
        window.ipcRenderer.send(
          "main-post-receive",
          JSON.stringify({
            requestId,
            method,
            data: ret,
          })
        );
      }
    }
  );
};

// 当所有请求都解决时，才隐藏loading。
let counter = 0;
let instance: any = null;
export const loading = {
  open(text?: string) {
    counter++;
    if (counter > 0) {
      instance = ElLoading.service({ background: "transparent", text });
    }
  },
  close() {
    if (counter <= 0) {
      return;
    }
    if (counter > 0) {
      counter--;
    }
    if (counter === 0 && instance && typeof instance.close === "function") {
      instance.close();
      instance = null;
    }
  },
  isComplete() {
    return counter === 0;
  },
};
