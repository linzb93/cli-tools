import { CronJob } from "cron";
import logger from "@/common/logger";
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
    const message = `定时任务：${app.name}，${cronstrue.toString(app.cron, {
        locale: 'zh_CN'
      })}执行一次。`
    process.send?.({
      type: 'message',
      message
    })
    new CronJob(app.cron, () => {
      logger.web(message);
      app.onTick.bind(app);
    }, null, true);
  });
};
export default {
  register,
  start,
};
