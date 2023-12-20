import * as helperObj from '../../../util/helper.js';
// import bug from '../../bug/index.js';
import sitemap from '../../bug/sitemap.js';
import dayjs from 'dayjs';
type Helper = typeof helperObj;

type Notify = (content: string) => void;
export default {
  title: '每日bug报告',
  loaded: false,
  schedule: '09:10',
  actions: ({ helper, notify }: { helper: Helper; notify: Notify }) => {
    const matches = sitemap.find(
      (site) => dayjs(site.publishTime).diff(dayjs(), 'd') === 1
    );
    // bug.generate(matches);
  }
};
