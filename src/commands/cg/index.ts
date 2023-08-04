import BaseCommand from '../../util/BaseCommand.js';
import { fork } from 'child_process';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import dayjs from 'dayjs';
import lodash from 'lodash';
const { isNumber } = lodash;

interface Options {
  realtime: boolean;
  debug: boolean;
  publish: boolean;
}

class Cg extends BaseCommand {
  private action: string;
  private data: string;
  private options: Options;
  constructor(action: string, data: string, options: Options) {
    super();
    this.action = action;
    this.data = data;
    this.options = options;
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
    if (
      this.action === 'set' ||
      (this.action !== undefined && isNumber(Number(this.action)))
    ) {
      this.setForecast();
      return;
    }
    this.spinner.text = '正在启动服务器';
    const child = fork(
      path.resolve(this.helper.root, 'dist/commands/cg/server.js'),
      [...this.helper.processArgvToFlags(this.options)],
      {
        cwd: this.helper.root,
        detached: true,
        stdio: [null, null, null, 'ipc']
      }
    );
    child.on(
      'message',
      async ({
        port,
        currentPerformance
      }: {
        port: string;
        currentPerformance: number;
        msg: string;
      }) => {
        const db = this.helper.createDB('cg');
        await db.read();
        const { data } = db as any;
        this.spinner.succeed(
          `今日业绩监控服务已启动：${chalk.yellow(port)}端口。\n${
            currentPerformance !== 0
              ? `最新业绩：${chalk.magenta(currentPerformance)}元`
              : '服务器故障，无法获取最新业绩'
          }。\n服务将每过${chalk.cyan(
            this.options.realtime ? '3分钟' : '1小时'
          )}获取一次最新业绩。${
            !data.forecast
              ? `\n${chalk.red('今日预测还未提交，请尽快提交')}`
              : ''
          }`
        );
        child.unref();
        child.disconnect();
        process.exit(0);
      }
    );
  }
  private async getTodayResults() {
    this.spinner.text = '正在获取今日业绩';
    try {
      const { data } = await axios.post(
        this.ls.get('cg.oldPrefix') + '/AppApi/GetDkdData'
      );
      const res = data.Result.Total.TodayTurnover;
      this.spinner.succeed(
        `今日业绩：${chalk.yellow(res)}，本月业绩：${chalk.yellow(
          data.Result.Total.MonthTurnover
        )} ${chalk.gray(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}]`)}`
      );
    } catch (error) {
      this.spinner.fail('服务器故障，请稍后再试', true);
    }
  }
  private async getForecast() {
    this.spinner.text = '正在获取预测数据';
    Promise.all([
      axios
        .post(this.ls.get('cg.oldPrefix') + '/AppApi/GetDkdData')
        .then(({ data }) => data.Result.Total.TodayTurnover),
      axios
        .post(this.ls.get('oa.apiPrefix') + '/dkd/ad/forecast/query')
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
    const performance = this.data || Number(this.action);
    if (this.options.publish) {
      const cgData = this.ls.get('cg');
      const { data: fetchData } = await axios.post(
        this.ls.get('oa.apiPrefix') + '/dkd/ad/forecast/insert',
        {
          name: cgData.author,
          nameId: cgData.nameId,
          amount: performance
        }
      );
      if (fetchData.code === 200) {
        this.logger.success('今日预测推送成功');
      }
      return;
    }
    // 将设置结果保存在本地，定时发送。
    const db = this.helper.createDB('cg');
    await db.read();
    const { data } = db as any;
    data.forecast = performance;
    this.logger.success(`预测已提交，将在${chalk.cyan(data.publishTime)}推送`);
    await db.write();
  }
}
export default (action: string, data: string, options: Options) => {
  new Cg(action, data, options).run();
};
