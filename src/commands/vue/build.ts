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
import readPkg from 'read-pkg';
import getPort from 'detect-port';

interface PrepareData {
  root: string;
  id: string;
  name: string;
}
interface Options {
  force: boolean;
  prod: boolean;
  start?: Boolean;
}

class BuildServe extends BaseCommand {
  private options: Options;
  constructor(options: Options) {
    super();
    this.options = options;
  }
  async run() {
    const db = this.helper.createDB('vueServer');
    await db.read();
    const items = (db.data as any).items as VueServerInfo[];
    const match = (await getMatch({
      source: items,
      tip: '请选择要打包的项目'
    })) as VueServerInfo;
    const ip = await internalIp.v4();
    this.spinner.text = '正在打包';
    let beforeData: any;
    if (!this.options.start) {
      beforeData = await this.beforeOpenServe(match);
    }
    if (this.options.force || this.options.start) {
      // 强制模式下服务器不需要启动
      const url = `http://${ip}:${match.buildPort}`;
      const local = `http://localhost:${match.buildPort}`;
      clipboard.writeSync(url);
      this.spinner.succeed(`打包完成，服务器已启动：
    - 本地：${chalk.magenta(`${local}${beforeData.root}`)}
    - 网络：${chalk.magenta(`${url}${beforeData.root}`)}`);
      return;
    }
    const child = fork(
      path.resolve(this.helper.root, 'dist/commands/vue/build-server.js'),
      [`--static=${beforeData.id}`, `--root=${beforeData.root}`],
      {
        cwd: this.helper.root,
        detached: true,
        stdio: [null, null, null, 'ipc']
      }
    );
    child.on('message', async ({ port }: { port: string; message: string }) => {
      if (port) {
        const url = `http://${ip}:${port}`;
        const local = `http://localhost:${port}`;
        clipboard.writeSync(url);
        this.spinner.succeed(`打包完成，服务器已启动：
- 本地：${chalk.magenta(`${local}${beforeData.root}`)}
- 网络：${chalk.magenta(`${url}${beforeData.root}`)}`);
        match.buildPort = port.toString();
        match.root = beforeData.root;
        await db.write();
      }
      child.unref();
      child.disconnect();
      process.exit(0);
    });
  }
  private async beforeOpenServe(match: VueServerInfo): Promise<PrepareData> {
    const { options } = this;
    if (!options.force && match.buildPort) {
      this.spinner.fail(
        `项目已在端口${chalk.magenta(match.buildPort)}启动，无需重新部署`,
        true
      );
    }
    const root = await this.getProjectRoot(match.cwd);
    await fs.remove(path.resolve(this.helper.root, `data/vue/${match.id}`));
    const pkg = await readPkg({ cwd: match.cwd });
    if ((pkg.scripts as any)['build:test'] && !options.prod) {
      await execa('npm run build:test', {
        cwd: match.cwd
      });
    } else {
      await execa('npm run build', {
        cwd: match.cwd
      });
    }
    await fs.copy(
      `${match.cwd}/dist`,
      path.resolve(this.helper.root, `data/vue/${match.id}`),
      {
        recursive: true
      }
    );
    return {
      root,
      id: match.id,
      name: match.name
    };
  }
  private async getProjectRoot(cwd: string): Promise<string> {
    const config = (await import(pathToFileURL(`${cwd}/vue.config.js`).href))
      .default;
    return config.publicPath || '';
  }
  private async portOccupied(port: number) {
    return (await getPort(port)) === port;
  }
}

export default (options: Options) => {
  new BuildServe(options).run();
};
