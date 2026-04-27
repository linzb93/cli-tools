import axios from 'axios';
import chalk from 'chalk';
import dayjs from 'dayjs';
import net from 'node:net';
import { readSecret } from '@cli-tools/shared';
import { timeMsFormat } from '@/utils/helper';
import { createCommandReadline, type ReadlineCommand } from '@/utils/readline';
import type { Options, ParsedUsageData, UsageResponse } from './types';
import { logger } from '@/utils/logger';
import { COLOR_MAP } from '@/constant';

const MINIMAX_API_BASE = 'https://www.minimaxi.com/v1/api/openplatform';
const TCP_PORT = 19876;
let isWatchMode = false;
let tcpRefreshCallback: (() => void) | null = null;
let lastRefreshTime: Date | null = null;
let isFirstRender = true;

/**
 * 创建 TCP Server，接收 "/refresh" 命令刷新界面
 */
function createTcpServer(port: number): net.Server {
    const server = net.createServer((socket) => {
        logger.info(`TCP 客户端连接: ${socket.remoteAddress}:${socket.remotePort}`);

        socket.on('data', (data) => {
            const message = data.toString().trim();
            if (message === '/refresh' && tcpRefreshCallback) {
                logger.info('收到 /refresh 命令，刷新界面');
                tcpRefreshCallback();
                socket.write('OK: refreshed\n');
            } else {
                socket.write('UNKNOWN command\n');
            }
        });

        socket.on('error', (err) => {
            logger.error(`TCP socket error: ${err.message}`);
        });
    });

    server.listen(port, () => {
        // logger.info(`TCP server listening on port ${port}`);
    });

    return server;
}
/**
 * 获取 Minimax API Token
 */
async function getToken(): Promise<string> {
    return readSecret((db) => db.ai.apiKey.minimax);
}

/**
 * 调用 Minimax API
 */
async function fetchAPI<T>(endpoint: string, token: string): Promise<T> {
    const response = await axios.get<T>(`${MINIMAX_API_BASE}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    return response.data;
}

/**
 * 获取用量数据
 */
async function fetchUsage(token: string): Promise<UsageResponse> {
    return fetchAPI<UsageResponse>('/coding_plan/remains', token);
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

/**
 * 渲染进度条
 */
function renderProgressBar(percentage: number, width: number = 40): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * 渲染用量界面
 */
function render(data: ParsedUsageData): void {
    const { used, remaining, total, percentage, remainsTime } = data;
    console.clear();
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
        chalk.gray(`  距离下次重置时间还有${chalk.magenta(timeMsFormat(remainsTime, { minUnitIsMinute: true }))}`),
    );
    if (isWatchMode) {
        console.log();
        console.log(chalk.gray('  ───────────────────────────────────────────────────────'));
        if (lastRefreshTime) {
            console.log(chalk.gray(`  上次刷新: ${chalk.bold.white(dayjs(lastRefreshTime).format('HH:mm:ss'))}`));
        }
        console.log(
            chalk.gray(
                `  按 ${chalk.bold.white('Ctrl+C')} 退出 | 每 3 分钟自动刷新 | 输入 ${chalk.bold.white('/refresh')} 手动刷新`,
            ),
        );
        console.log(
            chalk.gray(`  TCP 端口: ${chalk.bold.white(TCP_PORT)} (发送 ${chalk.bold.white('/refresh')} 远程刷新)`),
        );
    }
    console.log();
}

/**
 * 显示错误信息（保留上一次数据）
 */
function renderError(error: Error, lastData: ParsedUsageData | null): void {
    console.clear();
    console.log(chalk.bold.cyan('\n  Minimax 用量监控'));
    console.log(chalk.gray('  ───────────────────────────────────────────────────────'));
    console.log();
    console.log(chalk.red(`  ⚠ API 请求失败: ${error.message}`));
    console.log();

    if (lastData) {
        console.log(chalk.yellow('  显示上一次正常数据:\n'));
        render(lastData);
    } else {
        console.log(chalk.gray('  等待网络恢复...\n'));
    }
}

/**
 * 启动交互式监控
 */
export async function minimaxService(options?: Options): Promise<() => void> {
    isWatchMode = !!options && options.watch;

    // run 模式：直接获取并显示一次，然后退出
    if (!isWatchMode) {
        let token: string;
        try {
            token = await getToken();
        } catch (error) {
            console.error(chalk.red('无法读取 Token，请检查 secret.json 中 ai.apiKey.minimax 配置'));
            process.exit(1);
        }

        try {
            const response = await fetchUsage(token);
            const data = parseUsageData(response);
            if (data) {
                render(data);
            }
        } catch (error) {
            if (error instanceof Error) {
                renderError(error, null);
            }
        }
        return () => {};
    }

    // 交互模式
    const interval = 180000; // 默认 3 分钟

    let token: string;
    try {
        token = await getToken();
    } catch (error) {
        console.error(chalk.red('无法读取 Token，请检查 secret.json 中 ai.apiKey.minimax 配置'));
        process.exit(1);
    }

    let lastData: ParsedUsageData | null = null;
    let timerId: NodeJS.Timeout | null = null;
    let isRunning = true;
    let tcpServer: net.Server | null = null;

    const refresh = async () => {
        if (!isRunning) return;

        lastRefreshTime = new Date();
        try {
            const response = await fetchUsage(token);
            const data = parseUsageData(response);

            if (data) {
                lastData = data;
                render(data);
            }
        } catch (error) {
            if (error instanceof Error) {
                renderError(error, lastData);
            }
        }
    };

    // 定义 /refresh 命令
    const refreshCommand: ReadlineCommand = {
        name: 'refresh',
        description: '立即刷新用量数据',
        handler: async () => {
            await refresh();
        },
    };

    // 立即执行一次
    await refresh();

    // 设置定时刷新
    timerId = setInterval(refresh, interval);

    // 创建 TCP server 接收 /refresh 命令
    tcpRefreshCallback = refresh;
    tcpServer = createTcpServer(TCP_PORT);

    // 启动 readline 交互
    const readlinePromise = createCommandReadline([refreshCommand], {
        prompt: '\n输入指令> ',
    });

    // 监听 readline 关闭
    readlinePromise.then(() => {
        isRunning = false;
        if (timerId) {
            clearInterval(timerId);
        }
        if (tcpServer) {
            tcpServer.close();
        }
    });

    // 处理 Ctrl+C 退出
    process.on('SIGINT', () => {
        isRunning = false;
        if (timerId) {
            clearInterval(timerId);
        }
        if (tcpServer) {
            tcpServer.close();
        }
        process.exit(0);
    });

    // 返回停止函数
    return () => {
        isRunning = false;
        if (timerId) {
            clearInterval(timerId);
        }
        if (tcpServer) {
            tcpServer.close();
        }
    };
}
