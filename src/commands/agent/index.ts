import chalk from 'chalk';
import path from 'node:path';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import { pick } from 'lodash-es';
import monitor from '@/commands/monitor';
import BaseCommand from '@/util/BaseCommand';
import stop from './stop.js';
interface Options {
  proxy: string;
  port: string;
  debug: boolean;
  copy: boolean;
}
export interface CacheItem {
  proxy: string;
  name: string;
  port?: string;
}
interface CacheSaveOption {
  choosed: boolean;
  projName: string;
}

interface DbData {
  items: CacheItem[];
}

class Agent extends BaseCommand {
  private subCommand?: string;
  private options: Options;
  constructor(subCommand: string, options: Options) {
    super();
    this.subCommand = subCommand;
    this.options = options;
  }
  async run() {
    const { subCommand, options } = this;
    if (subCommand === 'stop') {
      stop();
      return;
    } else if (subCommand !== undefined) {
      this.logger.error('命令不存在，请重新输入');
      return;
    }
    this.helper.validate(options, {
      proxy: [
        {
          pattern: /^https?\:/,
          message: '格式不合法，请输入网址类型的'
        }
      ],
      port: [
        {
          validator: (_, value) => Number(value) > 1000 || value === undefined,
          message: '端口号请输入1000以上的整数'
        }
      ]
    });
    const db = this.helper.createDB('agent');
    await db.read();
    db.data = db.data || {};
    const cacheData = (db.data as DbData).items;
    const match = cacheData.find((item) => item.proxy === options.proxy);
    if (!match) {
      if (!options.proxy) {
        const { server } = await this.helper.inquirer.prompt([
          {
            message: '请选择要开启的代理服务器',
            type: 'list',
            choices: cacheData.map((data) => ({
              name: `${data.name} ${chalk.green(`(${data.proxy})`)}`,
              value: data.proxy
            })),
            name: 'server'
          }
        ]);
        options.proxy = server;
      } else {
        const ans = (await this.helper.inquirer.prompt([
          {
            type: 'confirm',
            message: '是否将项目数据存入缓存？',
            name: 'choosed'
          },
          {
            type: 'input',
            message: '请输入项目名称',
            name: 'projName',
            when: (answer) => answer.choosed
          }
        ])) as CacheSaveOption;
        if (ans.choosed) {
          (db.data as DbData).items.push({
            name: ans.projName,
            proxy: options.proxy
          });
          await db.write();
        }
      }
    }
    if (!options.debug) {
      const child = fork(
        path.resolve(this.helper.root, 'dist/commands/agent/server.js'),
        [
          ...this.helper.processArgvToFlags(
            pick(options, ['proxy', 'port', 'debug', 'copy'])
          ),
          '--from-bin=mycli-agent'
        ],
        {
          cwd: this.helper.root,
          detached: true,
          stdio: [null, null, null, 'ipc']
        }
      );
      child.on(
        'message',
        async ({ port, ip }: { port: string; ip: string }) => {
          console.log(`
    代理服务器已在 ${chalk.yellow(port)} 端口启动：
    - 本地：${chalk.magenta(`http://localhost:${port}/proxy`)}
    - 网络：${chalk.magenta(`http://${ip}:${port}/proxy`)}
    路由映射至：${chalk.cyan(options.proxy)}`);
          const items: CacheItem[] = this.ls.get('items').value();
          const match = items.find((item) => item.proxy === options.proxy);
          (match as CacheItem).port = port;
          (db.data as DbData).items = items;
          await db.write();
          child.unref();
          child.disconnect();
          process.exit(0);
        }
      );
    } else {
      monitor(
        path.resolve(fileURLToPath(import.meta.url), '../server.js'),
        this.helper.processArgvToFlags(
          pick(options, ['proxy', 'port', 'debug', 'copy'])
        ) as string[]
      );
    }
  }
}

export default (subCommand: string, options: Options) => {
  new Agent(subCommand, options).run();
};
