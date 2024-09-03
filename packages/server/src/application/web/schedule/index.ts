import { CronJob } from 'cron';
import BaseApp from './Base';

type AppType = new () => BaseApp

const apps:BaseApp[] = [];

const register = (App: AppType) => {
  apps.push(new App());
};

const start = () => {
  apps.forEach(app => {
    new CronJob(
      app.cron, // cronTime
      function () {
        app.onTick();
      }, // onTick
      null, // onComplete
      true, // start
    );
  })
}
export default {
  register,
  start
}