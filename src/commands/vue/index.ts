import path from 'path';
import clipboard from 'clipboardy';
import { fork } from 'child_process';
import BaseCommand from '../../util/BaseCommand.js';
import { getMatches } from './utils.js';

import setProject from './set.js';
import stopProject from './stop.js';
import buildServe from './build.js';
interface Options {
  copy: Boolean;
}

export interface VueServerInfo {
  cwd: string;
  name: string;
  servePort: string;
  buildPort: string;
  root: string;
  id: string;
}

class Vue extends BaseCommand {
  private datas: any[];
  private options: Options;
  constructor(datas: any[], options: Options) {
    super();
    this.datas = datas;
    this.options = options;
  }
  async run() {
    const { options, datas } = this;
    if (datas[0] === 'set') {
      setProject(datas.slice(1));
      return;
    }
    if (datas[0] === 'stop') {
      stopProject();
      return;
    }
    if (datas[0] === 'build') {
      buildServe({ force: false });
      return;
    }
    const db = this.helper.createDB('vueServer');
    await db.read();
    const items = (db.data as any).items as VueServerInfo[];
    const match = (await getMatches({
      source: items,
      tip: '请选择要开启的项目',
      isServe: true
    })) as VueServerInfo;
    this.spinner.text = `正在启动项目${match.name}`;
    const child = fork(
      path.resolve(this.helper.root, 'dist/commands/vue/server.js'),
      [`--cwd=${match.cwd}`]
    );
    child.on('message', async (data: any) => {
      if (data.message) {
        this.spinner.fail(`项目${match.name}启动失败：\n${data.message}`);
        process.exit(0);
      } else {
        this.spinner.succeed(`项目${match.name}启动成功，地址是：${data.url}`);
      }
      const port = data.url.match(/\:(\d+)/)[1];
      match.servePort = port;
      await db.write();
      if (options.copy) {
        clipboard.writeSync(data.url);
      }
      child.unref();
      child.disconnect();
      process.exit(0);
    });
  }
}

export default (data: any[], options: Options) => {
  new Vue(data, options).run();
};
