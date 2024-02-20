type Notify = (content: string) => void;
export default {
  loaded: true,
  name: '测试通知功能',
  executeTime: '11:47',
  actions: async ({ notify, params }: { notify: Notify; params: any }) => {
    notify(JSON.stringify(params));
  }
};
