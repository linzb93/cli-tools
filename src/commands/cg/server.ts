import getPort from 'detect-port';
import express from 'express';
import notifier from 'node-notifier';
import axios from 'axios';
import ls from '../../util/ls.js';
(async () => {
  const app = express();
  const targets = 'a'
    .repeat(20)
    .split('')
    .map((_: any, index) => ({
      data: (index + 1) * 5000,
      loaded: false
    }));
  async function init() {
    const { data } = await axios.post(
      ls.get('cg.oldPrefix') + '/AppApi/GetDkdData'
    );
    const res = data.Result.Total.TodayTurnover;
    for (const target of targets) {
      if (res >= target.data && !target.loaded) {
        notifier.notify(`今日业绩突破${target.data}，目前已到达${res}`);
        target.loaded = true;
        return;
      }
    }
  }
  init();
  setInterval(async () => {
    init();
  }, 1000 * 60 * 3);
  const port = await getPort(6000);
  app.listen(port, () => {
    process.send?.({
      port
    });
  });
})();
