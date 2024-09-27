import chalk from "chalk";
import dayjs from "dayjs";
import BaseCommand from "@/common/BaseCommand";
import sql from "@/common/sql";
import { userForcastList, setUserForcast } from "@/model/http/cg";
import { getPerformanceData } from "./shared";

export interface Options {
  full: boolean;
  help?: boolean;
}

interface User {
  name: string;
  amount: number;
}

export default class extends BaseCommand {
  async main(action: string, data: string, options: Options) {
    const actions = {
      get: () => this.renderTodayResult(),
      user: () => this.getForecast(options),
      set: () => this.setForecast(data)
    }
    actions[action]();
  }
  private async renderTodayResult() {
    this.spinner.text = "正在获取今日业绩";
    try {
      const [todayData, monthData] = await getPerformanceData();
      this.spinner.succeed(
        `今日业绩：${chalk.yellow(todayData)}，本月业绩：${chalk.yellow(
          monthData
        )} ${chalk.gray(`[${dayjs().format("YYYY-MM-DD HH:mm:ss")}]`)}`
      );
    } catch (error) {
      this.spinner.fail(error);
    }
  }

  private async getForecast(options: Options) {
    this.spinner.text = "正在获取预测数据";
    const promiseMap: any[] = [userForcastList().then((data) => data.result)];
    if (options.full) {
      promiseMap.push(getPerformanceData());
    }
    const resList = await Promise.all(promiseMap);
    let totalText = "";
    if (resList.length > 1) {
      const [todayData, monthData] = resList[1];
      totalText += `当前业绩：${chalk.yellow(
        todayData
      )}，本月业绩：${chalk.yellow(monthData)}。`; 
    }
    if (!resList[0].length) {
      totalText += "预测还未开始。";
    } else {
      totalText += "预测结果如下：";
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
  }
  private async setForecast(data: string) {
    const performance = Number(data);
    const cgData = await sql((db) => db.cg);
    const { data: fetchData } = await setUserForcast({
      name: cgData.author,
      nameId: cgData.nameId,
      amount: performance,
    });
    if (fetchData.code === 200) {
      this.logger.success("今日预测推送成功");
    } else {
      this.logger.error(fetchData.msg);
    }
  }
}
