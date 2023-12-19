import clipboard from 'clipboardy';
import fs from 'fs-extra';
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
      res.send('ok');
    });
    app.post('/getImg', async (req, res) => {
      fs.createReadStream('./test.png').pipe(res);
    });
  }
};
