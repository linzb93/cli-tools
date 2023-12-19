import express from 'express';
import * as helper from '../../util/helper.js';
import bodyParser from 'body-parser';
import fs from 'fs-extra';
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
  try {
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
  } catch (e) {
    helper.log((e as Error).message);
  }
  app.listen(6060, async () => {
    const ip = await getIp();
    process.send?.({
      ip,
      port: 6000,
      services
    });
  });
})();
