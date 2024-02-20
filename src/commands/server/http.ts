import express from 'express';
import * as helper from '../../util/helper.js';
import logger from '../../util/logger.js';
import { connectService } from '../../util/service/index.js';
import bodyParser from 'body-parser';
import fs from 'fs-extra';
import chalk from 'chalk';
import path from 'path';
import notifier from 'node-notifier';

import { get as getIp } from '../ip.js';
// import mysql from '../../util/service/mysql.js';

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
  const scheduleClient = await connectService('schedule');
  // const mysqlConnection = mysql();
  // mysqlConnection.query('select * from dept where id = 1', (err, result) => {
  //   console.log('数据库搜索');
  //   console.log(result);
  // });
  for (const task of tasks) {
    const taskContent = (await import(`./tasks/${task}`)).default;
    if (!taskContent.loaded) {
      continue;
    }
    services.push(
      `${taskContent.executeTime ? chalk.red('[定时任务]') : ''}${
        taskContent.name
      }`
    );
    if (!taskContent.executeTime) {
      taskContent.actions({
        app,
        helper,
        notify
      });
    } else {
      scheduleClient.send({
        executeTime: taskContent.executeTime,
        action: task.replace('.js', '')
      });
    }
  }
  const callback = async (obj: any) => {
    const matchTask = tasks.find((task) => task === `${obj.action}.js`);
    console.log(`收到任务：${matchTask}`);
    if (!matchTask) {
      return;
    }
    const taskContent = (await import(`./tasks/${matchTask}`)).default;
    taskContent.actions({
      app,
      helper,
      notify,
      params: obj.params
    });
  };
  scheduleClient.listen(callback);

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
${serverList}`);

    console.log('监听服务已开启');
  });
})();
