import getPort from 'detect-port';
import express from 'express';
import notifier from 'node-notifier';
import axios from 'axios';

(async () => {
  const app = express();
  const users = [
    {
      name: '程麟',
      target: 5000,
      loaded: false
    },
    {
      name: '林志斌',
      target: 11000,
      loaded: false
    },
    {
      name: '练继録',
      target: 15000,
      loaded: false
    },
    {
      name: '曾小雨',
      target: 21000,
      loaded: false
    }
  ];
  setInterval(async () => {
    const { data } = await axios.post(
      'http://wxdp.fjdaze.com/AppApi/GetDkdData'
    );
    const res = data.Result.Total.TodayTurnover;
    for (const user of users) {
      if (res >= user.target && !user.loaded) {
        notifier.notify(`今日业绩已过${user.target}，请通知${user.name}`);
        user.loaded = true;
        return;
      }
    }
  }, 1000 * 60);
  const port = await getPort(6000);
  app.listen(port, () => {
    process.send?.({
      port
    });
  });
})();
