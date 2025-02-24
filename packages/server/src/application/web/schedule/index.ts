import BaseApp from "./Base";

type AppType = new () => BaseApp;

const apps: BaseApp[] = [];

const register = (App: AppType) => {
  apps.push(new App());
};

function intervalFmt(interval: number) {
  const timeUnits = ["秒", "分钟", "小时"];
  let i = 0;
  let num = interval;
  while (num / 1000 > 60 && i < timeUnits.length) {
    i += 1;
    num = parseInt((num / 1000).toString());
  }
  return `${num}${timeUnits[i]}`;
}

const start = () => {
  apps.forEach((app) => {
    const message = `定时任务：${app.name}，每${intervalFmt(
      app.interval
    )}执行一次。`;
    process.send?.({
      type: "message",
      message,
    });
    app.nextExecuateTime = Date.now() + app.interval;
  });
  setInterval(() => {
    apps.forEach((app) => {
      if (app.nextExecuateTime <= Date.now()) {
        app.onTick.bind(app);
        app.nextExecuateTime += app.interval;
      }
    });
  }, 1000 * 60);
};
export default {
  register,
  start,
};
