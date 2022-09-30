import BaseCommand from '../../util/BaseCommand.js';
import { fork } from 'child_process';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import dayjs from 'dayjs';
class Cg extends BaseCommand {
  private action: string;
  constructor(action: string) {
    super();
    this.action = action;
  }
  async run() {
    if (this.action === 'get') {
      this.getTodayResults();
      return;
    }
    const child = fork(
      path.resolve(this.helper.root, 'dist/commands/cg/server.js'),
      [],
      {
        cwd: this.helper.root,
        detached: true,
        stdio: [null, null, null, 'ipc']
      }
    );
    child.on('message', async ({ port }: { port: string }) => {
      this.spinner.succeed(`今日业绩监控服务已启动：${port}端口`);
      child.unref();
      child.disconnect();
      process.exit(0);
    });
  }
  async getTodayResults() {
    this.spinner.text = '正在获取今日业绩';
    const { data } = await axios.post(
      'http://wxdp.fjdaze.com/AppApi/GetDkdData'
    );
    const res = data.Result.Total.TodayTurnover;
    this.spinner.succeed(
      `今日业绩：${chalk.yellow(res)} ${chalk.gray(
        `[${dayjs().format('YYYY-MM-DD HH:mm:ss')}]`
      )}`
    );
  }
}

export default (action: string) => {
  new Cg(action).run();
};
