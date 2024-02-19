import express from 'express';
import * as helper from '../../util/helper.js';
import logger from '../../util/logger.js';
import bodyParser from 'body-parser';
import fs from 'fs-extra';
import dayjs from 'dayjs';
import chalk from 'chalk';
import path from 'path';
import notifier from 'node-notifier';
import { v4 as uuidv4 } from 'uuid';
import { get as getIp } from '../ip.js';
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
  const todayFormat = dayjs().format('YYYY-MM-DD');
  const services: any[] = [];
  // 创建任务队列
  const taskQueue: any[] = [];
  setInterval(() => {
    if (!taskQueue.length) {
      return;
    }
    for (let i = 0; i < taskQueue.length; i++) {
      if (taskQueue[i].schedule) {
        if (dayjs().isAfter(`${todayFormat} ${taskQueue[i].schedule}`)) {
          taskQueue[i].actions({
            app,
            helper,
            notify
          });
          if (!taskQueue[i].interval) {
            taskQueue.splice(i, 1);
          } else {
            taskQueue[i].schedule = '';
            taskQueue[i].lastOperateTime = dayjs().format('HH:mm:ss');
          }
        }
      } else if (
        dayjs().isAfter(
          dayjs(`${todayFormat} ${taskQueue[i].lastOperateTime}`).add(
            taskQueue[i].interval,
            'ms'
          )
        )
      ) {
        taskQueue[i].actions({
          app,
          helper,
          notify
        });
        taskQueue[i].lastOperateTime = dayjs().format('HH:mm:ss');
      }
    }
  }, 1000 * 5);
  for (const task of tasks) {
    const obj = (await import(`./tasks/${task}`)).default;
    if (!obj.loaded) {
      continue;
    }
    services.push(obj.name);
    if (obj.schedule) {
      taskQueue.push({
        id: uuidv4(),
        schedule: obj.schedule,
        actions: obj.actions,
        interval: obj.interval,
        lastOperateTime: ''
      });
      continue;
    }
    obj.actions({
      app,
      helper,
      notify
    });
  }
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
