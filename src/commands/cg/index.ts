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
  async getForecast() {
    this.spinner.text = '正在获取预测数据';
    Promise.all([
      axios
        .post('http://wxdp.fjdaze.com/AppApi/GetDkdData')
        .then(({ data }) => data.Result.Total.TodayTurnover),
      axios
        .post('http://api.diankeduo.cn//zhili/dkd/ad/forecast/query')
        .then(({ data }) => data.result)
    ]).then(([currentPerformance, list]) => {
      let idx = 0;
      for (let index = 0; index < list.length; index++) {
        if (index === 0 && currentPerformance <= list[index].amount) {
          break;
        } else if (
          index === list.length - 1 &&
          currentPerformance >= list[index].amount
        ) {
          idx = list.length - 1;
          break;
        } else if (
          currentPerformance >= list[index].amount &&
          currentPerformance <= list[index + 1].amount
        ) {
          if (
            list[index + 1].amount - currentPerformance >
            currentPerformance - list[index].amount
          ) {
            idx = index;
            break;
          } else {
            idx = index + 1;
            break;
          }
        }
      }
      this.spinner.succeed(`当前业绩：${currentPerformance}。预测结果如下：`);
      console.log(
        list
          .map((user: any, index: number) => {
            const output = `${index + 1}. ${user.name}: ${user.amount}`;
            if (index === idx) {
              return chalk.bold.yellow(output);
            }
            return output;
          })
          .join('\n')
      );
    });
  }
  async setForecast() {
    const { performance } = await this.helper.inquirer.prompt({
      message: '请输入你预测的业绩',
      name: 'performance',
      type: 'input'
    });
    const { data } = await axios.post(
      'http://api.diankeduo.cn/zhili/dkd/ad/forecast/insert',
      {
        name: '林志斌',
        nameId: 585,
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

export default (action: string) => {
  new Cg(action).run();
};
