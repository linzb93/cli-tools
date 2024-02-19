import express from 'express';
import * as helper from '../../util/helper.js';
import logger from '../../util/logger.js';
import createConnection from '../../util/service/index.js';
import bodyParser from 'body-parser';
import fs from 'fs-extra';
import chalk from 'chalk';
import path from 'path';
import notifier from 'node-notifier';
import { get as getIp } from '../ip.js';
import ipc from 'node-ipc';

ipc.config.id = 'client';
ipc.config.retry = 1500;

function notify(content: string) {
  notifier.notify({
    title: 'mycli server通知',
    message: content
  });
}
(async () => {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json({ limit: '5mb' }));
  const tasks = await fs.readdir(
    path.resolve(helper.root, `./dist/commands/server/tasks`)
  );
  const services: any[] = [];
  const schedule = createConnection('schedule');
  for (const task of tasks) {
    const taskContent = (await import(`./tasks/${task}`)).default;
    if (!taskContent.executeTime) {
      taskContent.actions({
        app,
        helper,
        notify
      });
    } else {
      schedule.send({
        executeTime: taskContent.executeTime,
        name: task
      });
    }
  }
  schedule.onResponse(async (obj: any) => {
    const matchTask = tasks.find((task) => task === obj.action);
    if (!matchTask) {
      return;
    }
    const taskContent = (await import(`./tasks/${matchTask}`)).default;
    taskContent.actions({
      app,
      helper,
      notify
    });
  });
  const port = 6060;
  app.listen(port, async () => {
    const ip = await getIp();
    process.send?.({
      ip,
      port: 6000,
      services
    });
    const serverList = services
      .map((service, index) => chalk.cyan(`${index + 1}.${service}`))
      .join('\n');
    logger.success(`服务器已启动，地址是：${chalk.yellow(
      `http://${ip}:${port}`
    )},
以下服务已开启：
${serverList}
      `);
  });
})();
