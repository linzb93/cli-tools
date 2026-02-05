import { join } from 'node:path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { BaseService } from '@cli-tools/shared/base/BaseService';
import { cacheRoot, levelCharacters } from '@cli-tools/shared/utils/constant';
import { splitByLine } from '@cli-tools/shared/utils/helper';

export type TimePeriod = 'day' | 'week' | 'month' | 'all';

export interface CliAnalyseOptions {
    period?: TimePeriod;
}

/**
 * CLI使用分析命令类
 */
export class CliAnalyseService extends BaseService {
    private options: CliAnalyseOptions;

    constructor(options: CliAnalyseOptions = {}) {
        super();
        this.options = options;
    }

    /**
     * 主方法
     */
    async main() {
        const trackDir = join(cacheRoot, 'track');
        const files = (await fs.readdir(trackDir)).sort();
        const lines: string[] = [];

        // 获取时间过滤范围
        const filterRange = this.getTimeFilterRange();

        for (const file of files) {
            const content = await fs.readFile(join(trackDir, file), 'utf8');
            const fileLines = splitByLine(content);

            // 如果时间过滤启用，只保留在指定时间范围内的行
            if (filterRange) {
                const filteredLines = fileLines.filter((line) => {
                    const parsed = this.parseLine(line);
                    if (!parsed.time) return false;

                    const lineDate = new Date(parsed.time);
                    return lineDate >= filterRange.start && lineDate <= filterRange.end;
                });
                lines.push(...filteredLines);
            } else {
                lines.push(...fileLines);
            }
        }
        const errorLines = [];
        const result = lines.reduce<{ cmd: string; count: number; children: { cmd: string; count: number }[] }[]>(
            (acc, line) => {
                const ret = this.parseLine(line);
                if (!ret.cmd) {
                    errorLines.push(ret.message);
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
        const firstItem = this.parseLine(lines[0]);
        const periodText = this.getPeriodText();
        console.log(`${periodText}截至${chalk.magenta(firstItem.time)}，cli共使用${chalk.hex('#ffa500')(
            lines.length,
        )}次。各命令使用情况如下：
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
    }

    /**
     * 获取时间段文本描述
     * @returns 时间段文本描述
     */
    private getPeriodText(): string {
        const period = this.options.period || 'all';
        const periodMap = {
            day: '今日',
            week: '本周',
            month: '本月',
            all: '',
        };
        return periodMap[period] || '';
    }

    /**
     * 获取时间过滤范围
     * @returns 时间范围对象，如果为null则不进行过滤
     */
    private getTimeFilterRange(): { start: Date; end: Date } | null {
        const period = this.options.period || 'all';

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
    }

    /**
     * 解析行内容
     * @param line 行内容
     * @returns 解析结果
     */
    private parseLine(line: string) {
        const timeMatch = line.match(/\[(.+)\]/);
        const time = timeMatch ? timeMatch[1] : '';
        const cmdMatch = line.match(/\s([a-z]+)\s([a-z]*)/);
        const cmd = cmdMatch ? cmdMatch[1] : '';
        const subCmd = ['git', 'npm', 'ai'].includes(cmd) && cmdMatch ? cmdMatch[2] : '';
        return {
            time,
            cmd,
            message: !cmd ? line : '',
            subCmd,
        };
    }
}
