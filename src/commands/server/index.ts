import path from 'path';
import BaseCommand from '../../util/BaseCommand.js';
import express from 'express';
import clipboard from 'clipboardy';
import notifier from 'node-notifier';
import bodyParser from 'body-parser';
import fs from 'fs-extra';
import { get as getIp } from '../ip.js';
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
    }).then(() => {
      const app = express();
      app.use(bodyParser.urlencoded({ extended: false }));
      app.use(bodyParser.json());

      app.post('/copy', (req, res) => {
        const { text } = req.body;
        this.notify('收到来自iPhone的剪贴');
        clipboard.writeSync(decodeURIComponent(text) as string);
        res.send('ok');
      });

      app.post('/sendImg', async (req, res) => {
        const { file } = req.body;
        this.notify('收到来自iPhone的图片');
        const buf = Buffer.from(file, 'base64');
        const root = this.helper.isWin
          ? this.helper.desktop
          : `${this.helper.root}/.temp`;
        await fs.writeFile(`${root}/图片.png`, buf);

        res.send('ok');
      });
      app.listen(6060, async () => {
        const ip = await getIp();
        this.logger.success('服务器已在端口6060开启,IP是：' + ip);
      });
    });
  }
  notify(content: string) {
    notifier.notify({
      title: 'mycli server通知',
      icon: path.join(this.helper.root, 'source/dkd-logo.png'),
      message: content
    });
  }
}

export default () => {
  new Server().run();
};
