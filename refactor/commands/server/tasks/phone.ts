import clipboard from 'clipboardy';
import fs from 'fs-extra';
import path from 'path';
import { Express } from 'express';
import * as helperObj from '../../../util/helper.js';
type Helper = typeof helperObj;

type Notify = (content: string) => void;

export default {
  name: '同步剪贴板与图片',
  loaded: true,
  actions: ({
    app,
    helper,
    notify
  }: {
    app: Express;
    helper: Helper;
    notify: Notify;
  }) => {
    app.post('/copy', (req, res) => {
      const { text } = req.body;
      notify('收到来自iPhone的剪贴');
      clipboard.writeSync(decodeURIComponent(text) as string);
      res.send('ok');
    });
    app.get('/copy-data', (req, res) => {
      const copyData = clipboard.readSync();
      res.send(copyData);
    });
    app.post('/sendImg', async (req, res) => {
      req.pipe(fs.createWriteStream('test.png'));
      const { file } = req.body;
      await fs.writeFile(path.resolve(helper.desktop, '图片.png'), file);
      res.send('ok');
    });
    app.get('/getImgList', async (req, res) => {
      const dirs = await fs.readdir(path.resolve(helper.desktop, '/iPhone'));
      res.send({
        dirs
      });
    });
    app.get('/getImg', (req, res) => {
      const { name } = req.query;
      fs.createReadStream(
        path.resolve(helper.desktop, './iPhone', name as string)
      ).pipe(res);
    });
  }
};
