import { CronJob } from 'cron';
import BaseApp from './Base';
import logger from '@/common/logger';

type AppType = new () => BaseApp

const apps: BaseApp[] = [];

const register = (App: AppType) => {
  apps.push(new App());
};

const start = () => {
  apps.forEach(app => {
    logger.web(app.cron);
    new CronJob(
      app.cron,
      () => {
        logger.web(`${app.name}定时事件触发`);
        app.onTick();
      },
      null,
      true,
    );
  })
}
export default {
  register,
  start
}