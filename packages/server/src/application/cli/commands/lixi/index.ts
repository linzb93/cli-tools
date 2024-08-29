import chalk from "chalk";
import dayjs from "dayjs";
import BaseCommand from "../../shared/BaseCommand";

class Lixi extends BaseCommand {
  private source: {
    money: number;
    rate: number;
    saveDate: string;
  }[];
  constructor() {
    super();
    this.source = [
      {
        money: 200000,
        rate: 2.9,
        saveDate: "2023-12-31",
      },
      {
        money: 200000,
        rate: 2.8,
        saveDate: "2024-01-08",
      },
      {
        money: 100000,
        rate: 12,
        saveDate: "2024-06-27",
      },
    ];
  }
  async run() {
    const lixiTotal = this.source.reduce((sum, item) => {
      return (
        sum +
        Number(
          (
            ((item.money * item.rate) / 100 / 365) *
            dayjs().diff(item.saveDate, "d")
          ).toFixed(2)
        )
      );
    }, 0);
    const yesterdayLixi = this.source.reduce((sum, item) => {
      return sum + Number(((item.money * item.rate) / 100 / 365).toFixed(2));
    }, 0);
    this.logger.success(
      `截止今日，已有利息${chalk.red.bold(
        `${lixiTotal.toFixed(2)}元`
      )}，昨日收益${chalk.yellow.bold(`${yesterdayLixi}元`)}`
    );
  }
}

export default () => {
  new Lixi().run();
};
