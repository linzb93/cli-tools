import BaseCommand from '../../util/BaseCommand.js';
import clipboard from 'clipboardy';
import { fork } from 'child_process';
import { execaCommand as execa } from 'execa';
import { getMatches } from './utils.js';
import { pathToFileURL } from 'url';
import { VueServerInfo } from './index.js';
import fs from 'fs-extra';
import internalIp from 'internal-ip';
import path from 'path';
import chalk from 'chalk';
import pMap from 'p-map';
import readPkg from 'read-pkg';

interface PrepareData {
  root: string;
  id: string;
  name: string;
}
interface Options {
  force: boolean;
  prod: boolean;
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
    const matches = (await getMatches({
      source: items,
      tip: '请选择要打包的项目',
      isServe: false
    })) as VueServerInfo[];
    const ip = await internalIp.v4();
    this.spinner.text = '正在打包';
    const beforeData = await this.beforeOpenServe(matches);
    if (beforeData.length) {
      const child = fork(
        path.resolve(this.helper.root, 'dist/commands/vue/build-server.js'),
        [
          `--static=${beforeData.map((item) => item.id).join(',')}`,
          `--root=${beforeData.map((item) => item.root).join(',')}`
        ],
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
            if (matches.length === 1) {
              this.spinner.succeed(`打包完成，服务器已启动：
- 本地：${chalk.magenta(`${local}${beforeData[0].root}`)}
- 网络：${chalk.magenta(`${url}${beforeData[0].root}`)}`);
            } else {
              const callback = (item: PrepareData) => `
${item.name}:
- 本地：${chalk.magenta(`${local}${item.root}`)}
- 网络：${chalk.magenta(`${url}${item.root}`)}
                `;
              this.spinner.succeed(`打包完成，服务器已启动：
${beforeData.map(callback).join('\n')}`);
            }
            matches.forEach((match) => {
              match.buildPort = port.toString();
              match.root = beforeData[0].root;
            });
            await db.write();
          }
          child.unref();
          child.disconnect();
          process.exit(0);
        }
      );
    } else {
      const port = matches[0].buildPort;
      const url = `http://${ip}:${port}`;
      const callback = (item: PrepareData) => `
${item.name}:
- 本地：${chalk.magenta(`http://localhost:${port}${item.root}`)}
- 网络：${chalk.magenta(`${url}${item.root}`)}
                `;
      this.spinner.succeed(`打包完成，服务器已启动：
${beforeData.map(callback).join('\n')}
                `);
    }
  }
  private async beforeOpenServe(
    matches: VueServerInfo[]
  ): Promise<PrepareData[]> {
    const { options } = this;
    const data = options.force
      ? matches
      : matches.filter((item) => !item.buildPort);
    return await pMap(
      data,
      async (item) => {
        const root = await this.getProjectRoot(item.cwd);
        await fs.remove(path.resolve(this.helper.root, `data/vue/${item.id}`));
        const pkg = await readPkg({ cwd: item.cwd });
        if ((pkg.scripts as any)['build:test'] && !options.prod) {
          await execa('npm run build:test', {
            cwd: item.cwd
          });
        } else {
          await execa('npm run build', {
            cwd: item.cwd
          });
        }
        await fs.copy(
          `${item.cwd}/dist`,
          path.resolve(this.helper.root, `data/vue/${item.id}`),
          {
            recursive: true
          }
        );
        return {
          root,
          id: item.id,
          name: item.name
        };
      },
      { concurrency: 2 }
    );
  }
  private async getProjectRoot(cwd: string): Promise<string> {
    const config = (await import(pathToFileURL(`${cwd}/vue.config.js`).href))
      .default;
    return config.publicPath;
  }
}

export default (options: Options) => {
  new BuildServe(options).run();
};
