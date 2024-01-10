import * as helperObj from '../../../util/helper.js';
import { generate as bugGenerate } from '../../bug/index.js';
import sitemap from '../../bug/sitemap.js';
import dayjs from 'dayjs';
type Helper = typeof helperObj;

type Notify = (content: string) => void;
export default {
  name: '每日bug报告',
  loaded: true,
  schedule: '16:23',
  interval: 1000 * 10,
  actions: async ({ helper, notify }: { helper: Helper; notify: Notify }) => {
    // const matches = sitemap.find(
    //   (site) => dayjs(site.publishTime).diff(dayjs(), 'd') === 1
    // );
    // await bugGenerate(matches);
  }
};
