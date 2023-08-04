import getPort from 'detect-port';
import express from 'express';
import notifier from 'node-notifier';
import axios from 'axios';
import dayjs from 'dayjs';
import path from 'path';
import ls from '../../util/ls.js';
import * as helper from '../../util/helper.js';

const notify = (content: string) => {
  notifier.notify({
    title: '店客多通知',
    icon: path.join(helper.root, 'source/dkd-logo.png'),
    message: content
  });
};

(async () => {
  process.on('unhandledRejection', (e) => {
    helper.log((e as Error).message);
  });
  const isRealtime = process.argv.includes('--realtime');
  const isDebug = process.argv.includes('--debug');
  const interval = isRealtime ? 3 : 60;
  const app = express();
  const targets = 'a'
    .repeat(20)
    .split('')
    .map((_: any, index) => ({
      data: (index + 1) * 5000,
      loaded: false
    }));
  let calced = false;
  async function init() {
    if (isDebug) {
      if (calced) {
        return;
      }
      calced = true;
    }
    let res;
    try {
      res = await axios.post(ls.get('cg.oldPrefix') + '/AppApi/GetDkdData');
    } catch (error) {
      return 0;
    }
    const { data } = res;
    const current = data.Result.Total.TodayTurnover;
    if (!isRealtime) {
      notify(`截至${dayjs().format('HH:mm:ss')}，业绩已达到${current}元。`);
      return current;
    }
    for (const target of targets) {
      if (current >= target.data && !target.loaded) {
        notify(`今日业绩突破${target.data}元，目前已到达${current}元`);
        target.loaded = true;
        break;
      }
    }
    return current;
  }
  const currentPerformance = await init();
  // 获取最新业绩
  setInterval(async () => {
    init();
  }, 1000 * 60 * interval);
  // 定时推送预测结果
  const timer = setInterval(async () => {
    const db = helper.createDB('cg');
    await db.read();
    const { data } = db as any;
    if (dayjs().isAfter(dayjs().format(`YYYY-MM-DD ${data.publishTime}`))) {
      clearInterval(timer);
      if (data.forecast) {
        if (!isDebug) {
          const { forecast } = data;
          const cgData = ls.get('cg');
          try {
            const { data: fetchData } = await axios.post(
              ls.get('oa.apiPrefix') + '/dkd/ad/forecast/insert',
              {
                name: cgData.author,
                nameId: cgData.nameId,
                amount: forecast
              }
            );
            if (fetchData.code === 200) {
              notify('今日预测推送成功');
            }
          } catch (error) {
            notify(`提交失败，请手动提交。你的预测是：${forecast}`);
          }
        } else {
          notify('[debug]今日预测推送成功');
        }
        data.forecast = 0;
        await db.write();
      }
    }
  }, 1000 * 5);
  const port = await getPort(6000);
  app.listen(port, () => {
    process.send?.({
      port,
      currentPerformance
    });
  });
})();
