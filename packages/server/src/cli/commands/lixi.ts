import chalk from 'chalk';
import dayjs from 'dayjs';
import { logger } from '@/utils/logger';

export default () => {
    const source = [
        {
            money: 200000,
            rate: 2.9,
            saveDate: '2023-12-31',
        },
        {
            money: 200000,
            rate: 2.8,
            saveDate: '2024-01-08',
        },
        {
            money: 100000,
            rate: 12,
            saveDate: '2025-06-27',
        },
    ];
    const lixiTotal = source.reduce((sum, item) => {
        return sum + Number((((item.money * item.rate) / 100 / 365) * dayjs().diff(item.saveDate, 'd')).toFixed(2));
    }, 0);
    const yesterdayLixi = source.reduce((sum, item) => {
        return sum + Number(((item.money * item.rate) / 100 / 365).toFixed(2));
    }, 0);
    logger.success(
        `截止今日，已有利息${chalk.red.bold(`${lixiTotal.toFixed(2)}元`)}，昨日收益${chalk.yellow.bold(
            `${yesterdayLixi}元`
        )}`
    );
    process.exit(0);
};
