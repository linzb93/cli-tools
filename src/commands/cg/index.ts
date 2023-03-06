import BaseCommand from '../../util/BaseCommand.js';
import { fork } from 'child_process';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import dayjs from 'dayjs';
class Cg extends BaseCommand {
  private action: string;
  private data: string;
  constructor(action: string, data: string) {
    super();
    this.action = action;
    this.data = data;
  }
  async run() {
    if (this.action === 'get') {
      this.getTodayResults();
      return;
    }
    if (this.action === 'user') {
      this.getForecast();
      return;
    }
    if (this.action === 'set') {
      this.setForecast();
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
  private async getTodayResults() {
    this.spinner.text = '正在获取今日业绩';
    try {
      const { data } = await axios.post(
        'http://wxdp.fjdaze.com/AppApi/GetDkdData'
      );
      const res = data.Result.Total.TodayTurnover;
      this.spinner.succeed(
        `今日业绩：${chalk.yellow(res)} ${chalk.gray(
          `[${dayjs().format('YYYY-MM-DD HH:mm:ss')}]`
        )}`
      );
    } catch (error) {
      this.spinner.fail('服务器故障，请稍后再试', true);
    }
  }
  private async getForecast() {
    this.spinner.text = '正在获取预测数据';
    Promise.all([
      axios
        .post('http://wxdp.fjdaze.com/AppApi/GetDkdData')
        .then(({ data }) => data.Result.Total.TodayTurnover),
      axios
        .post('http://api.diankeduo.cn//zhili/dkd/ad/forecast/query')
        .then(({ data }) => data.result)
    ])
      .then(([currentPerformance, list]) => {
        if (list.length === 0) {
          this.spinner.succeed(
            `当前业绩：${currentPerformance}。预测还未开始。`
          );
          return;
        }
        this.spinner.succeed(
          `${chalk.gray(
            `[${dayjs().format('HH:mm:ss')}]`
          )}当前业绩：${currentPerformance}。预测结果如下：`
        );
        console.log(
          list
            .map((user: any, index: number) => {
              const output = `${index + 1}. ${user.name}: ${user.amount}`;
              if (index === 0) {
                return chalk.bold.yellow(output);
              }
              return output;
            })
            .join('\n')
        );
      })
      .catch(() => {
        this.spinner.fail('服务器故障，请稍后再试');
      });
  }
  private async setForecast() {
    const performance = this.data;
    const cgData = this.ls.get('cg');
    const { data } = await axios.post(
      'http://api.diankeduo.cn/zhili/dkd/ad/forecast/insert',
      {
        name: cgData.author,
        nameId: cgData.nameId,
        amount: performance
      }
    );
    if (data.code !== 200) {
      this.logger.error(`预测输入失败: ${data.msg}`);
    } else {
      this.logger.success('预测输入成功');
    }
  }
}
export default (action: string, data: string) => {
  new Cg(action, data).run();
};
