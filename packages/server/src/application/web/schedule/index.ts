import { CronJob } from "cron";
import BaseApp from "./Base";
import cronstrue from 'cronstrue';
import "cronstrue/locales/zh_CN"

type AppType = new () => BaseApp;

const apps: BaseApp[] = [];

const register = (App: AppType) => {
  apps.push(new App());
};

const start = () => {
  apps.forEach((app) => {
    process.send?.({
      type: 'message',
      message: `定时任务：${app.name}，${cronstrue.toString(app.cron, {
        locale: 'zh_CN'
      })}执行一次。`
    })
    new CronJob(app.cron, app.onTick.bind(app), null, true);
  });
};
export default {
  register,
  start,
};
