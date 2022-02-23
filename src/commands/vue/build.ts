import BaseCommand from '../../util/BaseCommand.js';
import clipboard from 'clipboardy';
import { fork } from 'child_process';
import { execaCommand as execa } from 'execa';
import { getMatch } from './utils.js';
import { pathToFileURL } from 'url';
import { VueServerInfo } from './index.js';
import fs from 'fs-extra';
import internalIp from 'internal-ip';
import path from 'path';
import chalk from 'chalk';

class BuildServe extends BaseCommand {
  async run() {
    const db = this.helper.createDB('vueServer');
    await db.read();
    const items = (db.data as any).items as VueServerInfo[];
    const match = await getMatch(items, '请选择要打包的项目');
    const [projRoot, ip] = await Promise.all([
      this.getProjectRoot(match.cwd),
      internalIp.v4()
    ]);
    if (!match.buildPort) {
      this.spinner.text = '正在打包';
      await fs.remove(path.resolve(this.helper.root, `data/vue/${match.id}`));
      await execa('npm run build:test', {
        cwd: match.cwd
      });
      await fs.copy(
        `${match.cwd}/dist`,
        path.resolve(this.helper.root, `data/vue/${match.id}`),
        {
          recursive: true
        }
      );
      const child = fork(
        path.resolve(this.helper.root, 'dist/commands/vue/build-server.js'),
        [`--static=data/vue/${match.id}`, `--root=${projRoot}`],
        {
          cwd: this.helper.root,
          detached: true,
          stdio: [null, null, null, 'ipc']
        }
      );
      child.on(
        'message',
        async ({ port, message }: { port: string; message: string }) => {
          if (port) {
            const url = `http://${ip}:${port}`;
            const local = `http://localhost:${port}`;
            clipboard.writeSync(url);
            this.spinner.succeed(
              `打包完成，服务器已启动：
            - 本地：${chalk.magenta(`${local}${projRoot}`)}
            - 网络：${chalk.magenta(`${url}${projRoot}`)}`
            );
            match.buildPort = port.toString();
            await db.write();
          } else if (message) {
            // 错误
          }
          child.unref();
          child.disconnect();
          process.exit(0);
        }
      );
    } else {
      const url = `http://${ip}:${match.buildPort}`;
      this.spinner.succeed(`服务器已启动，地址是：${url}${projRoot}`);
    }
  }
  private async getProjectRoot(cwd: string): Promise<string> {
    const config = (await import(pathToFileURL(`${cwd}/vue.config.js`).href))
      .default;
    return config.publicPath;
  }
}

export default () => {
  new BuildServe().run();
};
