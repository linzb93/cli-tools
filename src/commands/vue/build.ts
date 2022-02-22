import BaseCommand from '../../util/BaseCommand.js';
import clipboard from 'clipboardy';
import { fork } from 'child_process';
import { execaCommand as execa } from 'execa';
import { getMatch } from './utils.js';
import { VueServerInfo } from './index.js';
import fs from 'fs-extra';
import path from 'path';

class BuildServe extends BaseCommand {
  async run() {
    const db = this.helper.createDB('vueServer');
    await db.read();
    const items = (db.data as any).items as VueServerInfo[];
    const match = await getMatch(items, '请选择要打包的项目');
    this.spinner.text = '开始打包';
    await execa('npx vue-cli-service build', {
      cwd: match.cwd
    });
    await fs.copy(
      `${match.cwd}/dist`,
      path.resolve(this.helper.root, `data/vue/${match.id}`),
      {
        recursive: true
      }
    );
    if (!match.buildPort) {
      const child = fork(
        path.resolve(this.helper.root, 'dist/commands/vue/build-server.js'),
        [`--static=data/vue/${match.id}`]
      );
      child.on(
        'message',
        async ({ port, ip }: { port: string; ip: string }) => {
          const url = `http://${ip}:${port}`;
          clipboard.writeSync(url);
          this.spinner.succeed(`打包完成，服务器已启动，地址是：${url}`);
          match.buildPort = port;
          await db.write();
          child.unref();
          child.disconnect();
          process.exit(0);
        }
      );
    }
  }
}

export default () => {
  new BuildServe().run();
};
