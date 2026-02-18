import { join } from 'node:path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { cacheRoot } from '@cli-tools/shared/constant/path';
import { levelCharacters } from '@/constant';
import { logger } from '@/utils/logger';
import type { TimePeriod, CliAnalyseOptions } from './types';

/**
 * 获取时间段文本描述
 * @param period 时间周期
 * @returns 时间段文本描述
 */
const getPeriodText = (period: TimePeriod): string => {
    const periodMap = {
        day: '今日',
        week: '本周',
        month: '本月',
        all: '',
    };
    return periodMap[period] || '';
};

/**
 * 获取时间过滤范围
 * @param period 时间周期
 * @returns 时间范围对象，如果为null则不进行过滤
 */
const getTimeFilterRange = (period: TimePeriod): { start: Date; end: Date } | null => {
    if (period === 'all') {
        return null;
    }

    const start = new Date();

    switch (period) {
        case 'day':
            // 今天 00:00:00，但限制在最近一个月内
            start.setHours(0, 0, 0, 0);
            break;
        case 'week':
            // 本周一 00:00:00，但限制在最近一个月内
            const dayOfWeek = start.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 周日为0，需要特殊处理
            start.setDate(start.getDate() + diff);
            start.setHours(0, 0, 0, 0);
            break;
        case 'month':
            // 本月1号 00:00:00
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            break;
        default:
            logger.error(`未知时间周期: ${period},请输入 day | week | month | all`);
            break;
    }

    // 对于日和周查看，限制在最近一个月内
    const end = new Date();
    if (period === 'day' || period === 'week') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // 如果开始时间超过一个月前，则限制为一个月前
        if (start < oneMonthAgo) {
            return { start: oneMonthAgo, end };
        }
    }

    return { start, end };
};

/**
 * 解析JSON记录内容
 * @param record 记录对象
 * @returns 解析结果
 */
const parseRecord = (record: { time: string; nodejsVersion: null; command: string }) => {
    const command = record.command;
    const cmdMatch = command.match(/^([a-z]+)\s*([a-z]*)/);
    const cmd = cmdMatch ? cmdMatch[1] : '';
    const subCmd = ['git', 'npm', 'ai'].includes(cmd) && cmdMatch ? cmdMatch[2] : '';
    return {
        time: record.time,
        cmd,
        message: !cmd ? command : '',
        subCmd,
    };
};

/**
 * CLI使用分析命令
 */
export const cliAnalyseService = async (options: CliAnalyseOptions = {}) => {
    const period = options.period || 'all';
    const trackDir = join(cacheRoot, 'track');
    const files = (await fs.readdir(trackDir)).filter((file) => file.endsWith('.json')).sort();
    const records: Array<{ time: string; nodejsVersion: null; command: string }> = [];

    // 获取时间过滤范围
    const filterRange = getTimeFilterRange(period);

    for (const file of files) {
        const content = await fs.readFile(join(trackDir, file), 'utf8');
        let fileRecords: Array<{ time: string; nodejsVersion: null; command: string }> = [];

        try {
            fileRecords = JSON.parse(content);
        } catch (error) {
            console.warn(`解析文件 ${file} 失败:`, error);
            continue;
        }

        // 如果时间过滤启用，只保留在指定时间范围内的记录
        if (filterRange) {
            const filteredRecords = fileRecords.filter((record) => {
                const lineDate = new Date(record.time);
                return lineDate >= filterRange.start && lineDate <= filterRange.end;
            });
            records.push(...filteredRecords);
        } else {
            records.push(...fileRecords);
        }
    }

    const errorMessages = [];
    const result = records.reduce<{ cmd: string; count: number; children: { cmd: string; count: number }[] }[]>(
        (acc, record) => {
            const ret = parseRecord(record);
            if (!ret.cmd) {
                errorMessages.push(ret.message);
                return acc;
            }
            const match = acc.find((item) => item.cmd === ret.cmd);
            if (match) {
                match.count += 1;
                const subMatch = match.children.find((item) => item.cmd === ret.subCmd);
                if (subMatch) {
                    subMatch.count += 1;
                } else if (ret.subCmd) {
                    match.children.push({
                        cmd: ret.subCmd,
                        count: 1,
                    });
                }
            } else {
                acc.push({
                    cmd: ret.cmd,
                    count: 1,
                    children: ret.subCmd
                        ? [
                              {
                                  cmd: ret.subCmd,
                                  count: 1,
                              },
                          ]
                        : [],
                });
            }
            return acc;
        },
        [],
    );
    result.sort((prev, next) => (prev.count > next.count ? -1 : 1));
    result.forEach((item) => {
        if (!item.children) {
            return;
        }
        item.children.sort((prev, next) => (prev.count > next.count ? -1 : 1));
    });
    const firstRecord = records[0];
    const periodText = getPeriodText(period);
    console.log(`${periodText}从${chalk.magenta(firstRecord ? firstRecord.time : 'N/A')}至现在，cli共使用${chalk.hex(
        '#ffa500',
    )(records.length)}次。各命令使用情况如下：
${result
    .map((item) => {
        const title = `${chalk.yellow(item.cmd)}命令，使用过${chalk.cyan(item.count)}次`;
        if (!item.children || item.children.length === 0) {
            return title;
        }
        return `${title}
${item.children
    .map(
        (child, index) =>
            `${
                index === item.children.length - 1 ? levelCharacters.last : levelCharacters.contain
            }${levelCharacters.line.repeat(2)}${chalk.yellow(child.cmd)}，使用过${chalk.cyan(child.count)}次`,
    )
    .join('\n')}`;
    })
    .join('\n')}`);
};