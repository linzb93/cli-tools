import chalk from 'chalk';
import dayjs from 'dayjs';
import { logger } from '../../utils/logger';
import spinner from '../../utils/spinner';
import { getPerformanceData, userForcastList, setUserForcast } from './repository';

export interface Options {
    full: boolean;
    help?: boolean;
}

interface User {
    name: string;
    amount: number;
}

export const cgService = async (action: string, data: string, options: Options) => {
    if (action === 'get') {
        renderTodayResult();
        return;
    }
    if (action === 'user') {
        getForecast(options);
        return;
    }
    if (action === 'set') {
        setForecast(data);
    }
};

const renderTodayResult = async () => {
    spinner.text = '正在获取今日业绩';
    try {
        const { todayData, monthData, plan } = await getPerformanceData();
        spinner.succeed(
            `今日业绩：${chalk.yellow(todayData)}，本月业绩：${chalk.yellow(monthData)}${`(${(
                (monthData / plan) *
                100
            ).toFixed(2)}%)`} ${chalk.gray(`[${dayjs().format('HH:mm:ss')}]`)}`,
        );
    } catch (error) {
        spinner.fail(error);
    }
};

const getForecast = async (options: Options) => {
    spinner.text = '正在获取预测数据';
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
        spinner.succeed(`${totalText}`);
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
                    .join('\n'),
            );
        }
    });
};

const setForecast = async (data: string) => {
    const performance = Number(data);
    await setUserForcast(performance);
    logger.success('今日预测推送成功');
};
