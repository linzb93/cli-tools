import { CronJob } from "cron";
import BaseApp from "./Base";

type AppType = new () => BaseApp;

const apps: BaseApp[] = [];

const register = (App: AppType) => {
  apps.push(new App());
};

const start = () => {
  apps.forEach((app) => {
    new CronJob(app.cron, app.onTick, null, true);
  });
};
export default {
  register,
  start,
};
