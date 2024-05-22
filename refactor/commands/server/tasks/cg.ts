// 09:50 如果没有预测记录，提醒去预测。
import * as helperObj from '../../../util/helper.js';
import { get } from '../../cg/index.js';
type Helper = typeof helperObj;

type Notify = (content: string) => void;
export default {
  loaded: false,
  name: '冲高业绩实时播报',
  actions: async ({ helper, notify }: { helper: Helper; notify: Notify }) => {
    setInterval(async () => {
      const current = await get();
      if (current) {
        notify(`今日业绩${current}元`);
      }
    }, 1000 * 60 * 5);
  }
};
