import express from 'express';
import * as helper from '../../util/helper.js';
import logger from '../../util/logger.js';
import bodyParser from 'body-parser';
import fs from 'fs-extra';
import chalk from 'chalk';
import path from 'path';
import notifier from 'node-notifier';
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
  const services: any[] = [];
  for (const task of tasks) {
    const obj = (await import(`./tasks/${task}`)).default;
    if (!obj.loaded) {
      continue;
    }
    obj.actions({
      app,
      helper,
      notify
    });
    services.push(obj.name);
  }
  const port = 6060;
  app.listen(port, async () => {
    const ip = await getIp();
    process.send?.({
      ip,
      port: 6000,
      services
    });
    logger.success(`服务器已启动，地址是：${chalk.yellow(
      `http://${ip}:${port}`
    )},
以下服务已开启：
${services
  .map((service, index) => chalk.cyan(`${index + 1}.${service}`))
  .join('\n')}
      `);
  });
})();
