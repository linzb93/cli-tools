import chalk from "chalk";
import dayjs from "dayjs";
import { isNumber } from "lodash-es";
import BaseCommand from "@/common/BaseCommand";
import ls from "@/common/ls";
import { getPerformance, userForcastList, setUserForcast } from '@/model/http/cg';
export interface Options {
  realtime: boolean;
  debug: boolean;
  full: boolean;
  help?: boolean;
}

interface User {
  name: string;
  amount: number;
}

export default class extends BaseCommand {
  private action: string;
  private data: string;
  private options: Options;
  async main(action: string, data: string, options: Options) {
    this.action = action;
    this.data = data;
    this.options = options;
    if (this.action === "get") {
      this.renderTodayResult();
      return;
    }
    if (this.action === "user") {
      this.getForecast();
      return;
    }
    if (
      this.action === "set" ||
      (this.action !== undefined && isNumber(Number(this.action)))
    ) {
      this.setForecast();
    }
  }
  private async renderTodayResult() {
    this.spinner.text = "正在获取今日业绩";
    try {
      const [todayData, monthData] = await this.getPerformanceData();
      this.spinner.succeed(
        `今日业绩：${chalk.yellow(todayData)}，本月业绩：${chalk.yellow(
          monthData
        )} ${chalk.gray(`[${dayjs().format("YYYY-MM-DD HH:mm:ss")}]`)}`)
    } catch (error) {
      this.spinner.fail(error);
    }
  }
  /**
   * 返回本日业绩和本月业绩
   */
  async getPerformanceData() {
    try {
      const data = await getPerformance();
      return [
        data.Result.Total.TodayTurnover,
        data.Result.Total.MonthTurnover
      ];
    } catch (error) {
      throw new Error('服务器故障，请稍后再试');
    }
  }
  private async getForecast() {
    this.spinner.text = "正在获取预测数据";
    const promiseMap = [
      userForcastList().then((data) => data.result)
    ];
    if (this.options.full) {
      promiseMap.push(this.getPerformanceData())
    }
    Promise.all(promiseMap)
      .then((resList) => {
        let totalText = '';
        if (resList.length > 1) {
          const [todayData, monthData] = resList[1];
          totalText += `当前业绩：${chalk.yellow(todayData)}，本月业绩：${chalk.yellow(monthData)}。`;
          if (!resList[0].length) {
            totalText += '预测还未开始。';
          } else {
            totalText += '预测结果如下：'
          }
        }
        this.spinner.succeed(`${totalText}`);
        if (resList[0].length) {
          console.log(
            resList[0]
              .map((user: User, index: number) => {
                const output = `${index + 1}. ${user.name}: ${user.amount}`;
                if (index === 0) {
                  return chalk.bold.yellow(output);
                }
                return output;
              })
              .join("\n")
          );
        }
      });
  }
  private async setForecast() {
    const performance = Number(this.data) || Number(this.action);
    const cgData = ls.get("cg");
    const { data: fetchData } = await setUserForcast(
      {
        name: cgData.author,
        nameId: cgData.nameId,
        amount: performance,
      }
    );
    if (fetchData.code === 200) {
      this.logger.success("今日预测推送成功");
    }
  }
}
