import chalk from 'chalk';
import dayjs from 'dayjs';
import BaseCommand from '../util/BaseCommand.js';

class Lixi extends BaseCommand {
  private source: any[];
  constructor() {
    super();
    this.source = [
      {
        money: 200000,
        rate: 2.9,
        saveDate: '2023-12-31'
      },
      {
        money: 200000,
        rate: 2.8,
        saveDate: '2024-01-08'
      },
      // 下面2个回去再填
      {
        money: 150000,
        rate: 2.8,
        saveDate: '2021-03-28',
        dueDate: '2024-03-28',
        old: true
      },
      {
        money: 50000,
        rate: 2.8,
        saveDate: '2021-07-01',
        dueDate: '2024-07-01',
        old: true
      }
    ];
  }
  async run() {
    const lixiTotal = this.source.reduce((sum, item) => {
      return (
        sum +
        Number(
          (
            ((item.money * item.rate) / 100 / 365) *
            dayjs().diff(item.saveDate, 'd')
          ).toFixed(2)
        )
      );
    }, 0);
    const yesterdayLixi = this.source.reduce((sum, item) => {
      return sum + Number(((item.money * item.rate) / 100 / 365).toFixed(2));
    }, 0);
    const nearest = this.source
      .filter((item) => item.old)
      .reduce((match, item) => {
        if (!match.dueDate) {
          return item;
        }
        if (dayjs(match.dueDate).isAfter(item.dueDate)) {
          return item;
        }
        return match;
      }, {});
    this.logger.success(
      `截止今日，已有利息${chalk.red.bold(
        `${lixiTotal}元`
      )}，昨日收益${chalk.yellow.bold(`${yesterdayLixi}元`)}。将于${dayjs(
        nearest.dueDate
      ).diff(dayjs(), 'd')}天后收回本息${chalk.cyan(
        `${
          nearest.money *
          (1 +
            (nearest.rate / 100) *
              dayjs(nearest.dueDate).diff(nearest.saveDate, 'year'))
        }元`
      )}。`
    );
  }
}

export default () => {
  new Lixi().run();
};
