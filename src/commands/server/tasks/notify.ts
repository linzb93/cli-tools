type Notify = (content: string) => void;
export default {
  loaded: true,
  name: '测试IPC通信功能',
  executeTime: '',
  actions: async ({ notify }: { notify: Notify }) => {
    notify('收到IPC的通知');
  }
};
