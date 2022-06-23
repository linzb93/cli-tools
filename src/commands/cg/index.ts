import BaseCommand from '../../util/BaseCommand.js';
import { fork } from 'child_process';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';

class Cg extends BaseCommand {
  private action: string;
  private port: string;
  constructor(action: string) {
    super();
    this.action = action;
    this.port = '';
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
      this.spinner.succeed(`冲高日业绩监控服务已启动：${port}`);
      this.port = port;
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
    this.spinner.succeed(`今日业绩：${chalk.yellow(res)}`);
  }
}

export default (action: string) => {
  new Cg(action).run();
};
