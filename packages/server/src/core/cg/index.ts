import chalk from 'chalk';
import dayjs from 'dayjs';
import BaseCommand from '@/core/BaseCommand';
import { getPerformanceData, userForcastList, setUserForcast } from './shared';

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
        if (action === 'get') {
            this.renderTodayResult();
            return;
        }
        if (action === 'user') {
            this.getForecast(options);
            return;
        }
        if (action === 'set') {
            this.setForecast(data);
        }
    }
    private async renderTodayResult() {
        this.spinner.text = '正在获取今日业绩';
        try {
            const { todayData, monthData, plan } = await getPerformanceData();
            this.spinner.succeed(
                `今日业绩：${chalk.yellow(todayData)}，本月业绩：${chalk.yellow(monthData)}${`(${(
                    (monthData / plan) *
                    100
                ).toFixed(2)}%)`} ${chalk.gray(`[${dayjs().format('HH:mm:ss')}]`)}`
            );
        } catch (error) {
            this.spinner.fail(error);
        }
    }

    private async getForecast(options: Options) {
        this.spinner.text = '正在获取预测数据';
        const promiseMap: any[] = [userForcastList().then((data) => data.list)];
        if (options.full) {
            promiseMap.push(getPerformanceData());
        }
        Promise.all(promiseMap).then((resList) => {
            let totalText = '';
            if (resList.length > 1) {
                const { todayData, monthData } = resList[1];
                totalText += `当前业绩：${chalk.yellow(todayData)}，本月业绩：${chalk.yellow(monthData)}。`;
                if (!resList[0].length) {
                    totalText += '预测还未开始。';
                } else {
                    totalText += '预测结果如下：';
                }
            }
            this.spinner.succeed(`${totalText}`);
            if (resList[0].length) {
                const newList = resList[0]
                    .map((user: User, index: number) => ({
                        ...user,
                        isCurrent: index === 0,
                    }))
                    .sort((a: User, b: User) => a.amount - b.amount);
                console.log(
                    newList
                        .map((user: User & { isCurrent: boolean }, index: number) => {
                            const output = `${index + 1}. ${user.name}: ${user.amount}`;
                            if (user.isCurrent) {
                                return chalk.bold.yellow(output);
                            }
                            return output;
                        })
                        .join('\n')
                );
            }
        });
    }
    private async setForecast(data: string) {
        const performance = Number(data);
        await setUserForcast(performance);
        this.logger.success('今日预测推送成功');
    }
}
