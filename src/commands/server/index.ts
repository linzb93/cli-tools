import BaseCommand from '../../util/BaseCommand.js';
import express from 'express';
import notifier from 'node-notifier';
import bodyParser from 'body-parser';
import chalk from 'chalk';
import { get as getIp } from '../ip.js';
import path from 'path';
import fs from 'fs-extra';
class Server extends BaseCommand {
  run() {
    new Promise(async (resolve) => {
      if (!this.helper.isInVSCodeTerminal) {
        resolve(true);
        return;
      }
      const { ans } = await this.helper.inquirer.prompt({
        message: '检测到您将在VSCode中开启服务，这可能会带来不便，是否继续？',
        type: 'confirm',
        name: 'ans'
      });
      if (ans) {
        resolve(true);
      } else {
        this.logger.error('服务终止开启', true);
      }
    }).then(async () => {
      const app = express();
      app.use(bodyParser.urlencoded({ extended: false }));
      app.use(bodyParser.json({ limit: '5mb' }));
      const tasks = await fs.readdir(
        path.resolve(this.helper.root, `./dist/commands/server/tasks`)
      );
      const services: any[] = [];
      for (const task of tasks) {
        const obj = (await import(`./tasks/${task}`)).default;
        if (!obj.loaded) {
          continue;
        }
        obj.actions({
          app,
          helper: this.helper,
          notify: this.notify
        });
        services.push(obj.name);
      }
      app.listen(6060, async () => {
        const ip = await getIp();
        this.logger.success(`
服务器已在端口6060开启,地址是${chalk.yellow(`${ip}:6060`)}
下列服务已加载：
${services
  .map((service, index) => chalk.magenta(`${index + 1}.${service}`))
  .join('\n')}
        `);
      });
    });
  }
  notify(content: string) {
    notifier.notify({
      title: 'mycli server通知',
      message: content
    });
  }
}

export default () => {
  new Server().run();
};
