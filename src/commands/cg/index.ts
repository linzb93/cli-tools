import BaseCommand from '../../util/BaseCommand.js';
import { fork } from 'child_process';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import dayjs from 'dayjs';
import lodash from 'lodash';
const { last } = lodash;

interface ForecastItem {
  forecastDate: string;
  name: string;
  updateTime: string;
}
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
  private async getForecast() {
    this.spinner.text = '正在获取预测数据';
    Promise.all([
      axios
        .post('http://wxdp.fjdaze.com/AppApi/GetDkdData')
        .then(({ data }) => data.Result.Total.TodayTurnover),
      axios
        .post('http://api.diankeduo.cn//zhili/dkd/ad/forecast/query')
        .then(({ data }) => data.result)
    ]).then(([currentPerformance, list]) => {
      if (list.length === 0) {
        this.spinner.succeed(`当前业绩：${currentPerformance}。预测还未开始。`);
        return;
      }
      this.spinner.succeed(`当前业绩：${currentPerformance}。预测结果如下：`);
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
    });
  }
  private async setForecast() {
    let performance = this.data;
    if (!performance) {
      const advData = await this.getAdvantageForecast();
      performance = advData.performance;
      let list = advData.list.map(
        (user: any, index: number) =>
          `${index + 1}. ${user.name}: ${user.amount}`
      );
      list = list
        .slice(0, advData.index)
        .concat(chalk.green(`${' '.repeat(14)}<----`))
        .concat(list.slice(advData.index));
      console.log(list.join('\n'));
      const { confirm } = await this.helper.inquirer.prompt({
        message: `预测分析结果是${performance}元，排名第${
          advData.index + 1
        }位，是否提交`,
        name: 'confirm',
        type: 'confirm'
      });
      if (!confirm) {
        return;
      }
    }
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
  private async getAdvantageForecast(): Promise<any> {
    const db = this.helper.createDB('cg');
    await db.read();
    const forecastList = (db.data as any).forecast as ForecastItem[];
    let target = last(forecastList) as ForecastItem;
    if (target.updateTime !== dayjs().format('YYYY-MM-DD')) {
      const { data } = await axios.post(
        'http://api.diankeduo.cn//zhili/dkd/ad/forecast/user',
        {}
      );
      target = {
        forecastDate: dayjs(data.result.createTime).format('YYYY-MM-DD'),
        name: data.result.name,
        updateTime: dayjs().format('YYYY-MM-DD')
      };
      forecastList.push(target);
      await db.write();
    }
    // 获取今日已预测结果
    const { data } = await axios.post(
      'http://api.diankeduo.cn//zhili/dkd/ad/forecast/query'
    );
    const cgData = this.ls.get('cg');
    let ret = 0;
    const unpublishUsers = forecastList
      .filter(
        (item) => !data.result.find((user: any) => item.name === user.name)
      )
      .map((item) => item.name);
    if (
      unpublishUsers.length &&
      !unpublishUsers.some((item: any) => item.name === cgData.author)
    ) {
      const { confirm } = await this.helper.inquirer.prompt({
        type: 'confirm',
        message: `今日还有预测帝${chalk.yellow(
          unpublishUsers.join('、')
        )}未提交，是否提交预测结果？`,
        name: 'confirm'
      });
      if (!confirm) {
        process.exit(1);
      }
    } else if (
      unpublishUsers.some((item: any) => item.name === cgData.author)
    ) {
      const authorMatchTime = unpublishUsers.filter(
        (item: any) => item.name === cgData.author
      ).length;
      let sum = 0;
      data.result.forEach((user: any) => {
        const { length } = forecastList.filter(
          (item) => item.name === user.name
        );
        sum += user.amount * length;
      });
      const retString =
        sum / forecastList.length / (1 - authorMatchTime / forecastList.length);
      ret = parseInt(retString.toString());
    } else {
      let sum = 0;
      data.result.forEach((user: any) => {
        const len = forecastList.filter(
          (item) => item.name === user.name
        ).length;
        sum += user.amount * len;
      });
      ret = parseInt((sum / forecastList.length).toString());
    }
    const retIndex: number = (() => {
      for (let i = 0; i < data.result.length - 1; i++) {
        if (ret >= data.result[i].amount && ret <= data.result[i + 1].amount) {
          return i + 1;
        }
      }
      return data.result.length;
    })();
    // 检测预测结果是否被人包夹
    for (let i = 0; i < data.result.length - 1; i++) {
      const prev = Number(ret) - data.result[i];
      const next = data.result[i + 1] - Number(ret);
      if (prev > 0 && next > 0 && prev + next < 150) {
        const { confirm } = await this.helper.inquirer.prompt({
          message: `你预测的数据${ret}已被${data.result[i].name}:${
            data.result[i].amount
          }和${data.result[i + 1].name}:${
            data.result[i].amount
          }包夹，是否就近获取预测结果？`,
          type: 'confirm',
          name: 'confirm'
        });
        if (!confirm) {
          return {
            performance: ret,
            index: retIndex,
            list: data.result
          };
        }
        // 寻找差距在500以上的，然后靠近100
        if (
          data.result[i].amount - data.result[i - 1].amount > 500 ||
          i === 0
        ) {
          return {
            performance: (data.result[i].amount - 100).toString(),
            index: retIndex - 1,
            list: data.result
          };
        }
        return {
          performance: data.result[i + 1].amount + 100,
          index: retIndex + 1,
          list: data.result
        };
      }
    }
    return {
      performance: ret,
      index: retIndex,
      list: data.result
    };
  }
}
export default (action: string, data: string) => {
  new Cg(action, data).run();
};
