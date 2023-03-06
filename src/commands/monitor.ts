import { Readable } from 'stream';
import chokidar, { FSWatcher } from 'chokidar';
import { fork, exec, ChildProcess } from 'child_process';
import path from 'path';
import chalk from 'chalk';
import lodash from 'lodash';
import fs from 'fs-extra';
import dayjs from 'dayjs';
import BaseCommand from '../util/BaseCommand.js';

const { debounce } = lodash;

class Monitor extends BaseCommand {
  private filename: string | undefined;
  private combinedOptions: string[];
  private entryFile: string;
  private subProcess: ChildProcess | undefined;
  constructor(filename: string | undefined, combinedOptions: string[]) {
    super();
    this.filename = filename;
    this.combinedOptions = combinedOptions;
    this.entryFile = '';
  }
  async run() {
    const watcher = this.createWatcher();
    watcher.on(
      'change',
      debounce((file) => {
        console.log(
          `文件 ${chalk.green(file)} 更改，node monitor 重新启动。${chalk.gray(
            `[${dayjs().format('HH:mm:ss')}]`
          )}`
        );
        this.restartServer();
      }, 500)
    );

    process.on('SIGINT', () => {
      console.log(chalk.yellow('关闭进程'));
      process.exit(0);
    });
    process.stdin.on('data', (data) => {
      const str = data.toString().trim().toLowerCase();
      if (str === 'rs') {
        console.log(chalk.green('手动重启 node monitor'));
        this.restartServer();
      }
    });
    this.startServer();
    await this.helper.sleep(1000);
    const port = await this.getPortFromPid(this.subProcess?.pid as number);
    console.log(
      chalk.green(`node monitor 已启动，端口号：${chalk.yellow(port)}`)
    );
  }
  private createWatcher(): FSWatcher {
    const { filename } = this;
    let watcher: FSWatcher;
    if (filename === undefined) {
      // 监听整个项目
      watcher = chokidar.watch('**/*.js', {
        ignored: 'node_modules/*'
      });
      if (!watcher) {
        this.logger.error('文件路径不正确，请重新输入');
        process.exit(0);
      }
      this.entryFile = 'index.js';
    } else {
      if (filename.endsWith('.js')) {
        watcher = chokidar.watch(filename);
        this.entryFile = filename;
      } else {
        if (fs.existsSync(filename)) {
          watcher = chokidar.watch(`${filename}/**/*.js`);
          if (!fs.existsSync(path.resolve(filename, 'index.js'))) {
            this.logger.error(
              '项目文件夹以index.js作为入口，未检测到index.js',
              true
            );
          }
          this.entryFile = `${filename}/index.js`;
        } else if (fs.existsSync(`${filename}.js`)) {
          watcher = chokidar.watch(`${filename}.js`);
          this.entryFile = `${filename}.js`;
        } else {
          this.logger.error('文件路径不正确，请重新输入');
          process.exit(0);
        }
      }
    }
    return watcher;
  }
  private startServer() {
    this.subProcess = fork(this.entryFile, this.combinedOptions, {
      stdio: [null, 'inherit', null, 'ipc']
    }) as ChildProcess;
    (this.subProcess.stderr as Readable).pipe(process.stdout);
    this.subProcess.on('close', (_, sig) => {
      if (!sig) {
        this.logger.error('检测到服务器出现错误，已关闭', true);
      }
    });
  }
  private restartServer() {
    (this.subProcess as ChildProcess).removeAllListeners();
    (this.subProcess as ChildProcess).kill();
    this.startServer();
  }
  private async getPortFromPid(pid: number) {
    return new Promise((resolve) => {
      exec('netstat -ano', {}, (err, stdout) => {
        const match = stdout
          .split('\n')
          .find((line) => line.includes(`${pid}\r`)) as string;
        if (!match) {
          resolve(null);
          return;
        }
        const ret = /0\.0\.0\.0\:(\d+)/.exec(match) as RegExpExecArray;
        resolve(ret[1]);
      });
    });
  }
}

export default (filename: string, combinedOptions: string[]) => {
  new Monitor(filename, combinedOptions).run();
};
