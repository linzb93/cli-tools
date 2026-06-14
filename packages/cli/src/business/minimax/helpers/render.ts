import chalk from 'chalk';
import dayjs from 'dayjs';
import axios from 'axios';
import { timeFormatCN } from '@/utils/time';
import { logger } from '@/utils/logger';
import { renderProgressBar } from '@/utils/progress';
import { COLOR_MAP } from '@/constant';
import { readSecret } from '@cli-tools/shared/node';
import type { ParsedUsageData, UsageResponse } from '../types';
import type { MinimaxSchema } from './types';

/**
 * 获取用量数据
 */
async function fetchUsage(token: string): Promise<UsageResponse> {
    const response = await axios.get<UsageResponse>(
        `https://www.minimaxi.com/v1/api/openplatform/coding_plan/remains`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        },
    );
    if (!response.data.model_remains) {
        throw new Error(response.data.base_resp.status_msg);
    }
    return response.data;
}

/**
 * 解析用量数据
 */
function parseUsageData(response: UsageResponse): ParsedUsageData | null {
    if (!response.model_remains || response.model_remains.length === 0) {
        return null;
    }

    const data = response.model_remains[0];
    const total = data.current_interval_total_count;
    const remaining = data.current_interval_usage_count;
    const used = total - remaining;
    const percentage = total > 0 ? (used / total) * 100 : 0;

    return {
        modelName: data.model_name || 'Unknown',
        used,
        remaining,
        total,
        percentage,
        resetTime: dayjs(data.end_time).format('HH:mm:ss'),
        remainsTime: data.remains_time,
    };
}

const TCP_PORT = 19876;

let isWatchMode = false;
let lastRefreshTime: Date | null = null;

export function setWatchMode(value: boolean): void {
    isWatchMode = value;
}

/**
 * 渲染用量界面
 */
function render(data: ParsedUsageData): void {
    const { used, remaining, total, percentage, remainsTime } = data;
    logger.clearConsole();
    logger.big('Minimax', {
        color: COLOR_MAP.orange,
        random: true,
    });
    console.log(`  ${renderProgressBar(percentage)} ${chalk.green(used)} / ${total}`);
    console.log();
    console.log(
        chalk.white(
            `  剩余额度: ${chalk.bold.cyan(remaining)}${chalk.cyan(`(${(100 - percentage).toFixed(1) + '%'})`)}`,
        ),
    );
    console.log();
    console.log(
        chalk.gray(`  距离下次重置时间还有${chalk.magenta(timeFormatCN(remainsTime, { minUnitIsMinute: true }))}`),
    );
    if (isWatchMode) {
        console.log();
        console.log(chalk.gray('  ───────────────────────────────────────────────────────'));
        if (lastRefreshTime) {
            console.log(chalk.gray(`  上次刷新: ${chalk.bold.white(dayjs(lastRefreshTime).format('HH:mm:ss'))}`));
        }
        console.log(
            chalk.gray(
                `  按 ${chalk.bold.white('Ctrl+C')} 退出 | 每 30 分钟自动刷新 | 输入 ${chalk.bold.white('/refresh')} 手动刷新`,
            ),
        );
        console.log(
            chalk.gray(`  TCP 端口: ${chalk.bold.white(TCP_PORT)} (发送 ${chalk.bold.white('/refresh')} 远程刷新)`),
        );
    }
}

export async function refresh() {
    try {
        const token = await readSecret<string, MinimaxSchema>((db) => db.ai.apiKey.minimax);
        const response = await fetchUsage(token);
        const data = parseUsageData(response);
        if (data) {
            render(data);
        }
    } catch (error) {
        logger.error(`[${dayjs().format('HH:mm:ss')}]获取用量数据失败: ${(error as Error).message}`);
    }
}
