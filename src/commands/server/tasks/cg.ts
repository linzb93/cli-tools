// 09:50 如果没有预测记录，提醒去预测。
import * as helperObj from '../../../util/helper.js';
type Helper = typeof helperObj;

type Notify = (content: string) => void;
export default {
  loaded: false,
  shedule: '09:50',
  actions: ({ helper, notify }: { helper: Helper; notify: Notify }) => {}
};
