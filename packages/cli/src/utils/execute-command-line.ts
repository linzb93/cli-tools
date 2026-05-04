import chalk from 'chalk';
import dayjs from 'dayjs';
import { execaCommand } from 'execa';
import { retryAsync, onErrorReturn } from './promise';
import { timeFormatCN } from './time';
/**
 * 命令配置接口
 */
export interface CommandConfig {
    /**
     * 需要执行的命令
     */
    message: string;
    /**
     * 最大重试次数
     * @default 10
     */
    maxAttempts?: number;
    /**
     * 错误回调函数
     * @param {string} error - 错误信息
     * @returns { { shouldStop?: boolean }} 返回对象中的shouldStop为true时停止执行
     */
    onError?: (error: string) => onErrorReturn | Promise<onErrorReturn>;
}

export type Command = string | CommandConfig;

/**
 * 自定义执行停止错误
 * @class StopExecutionError
 * @extends {Error}
 */
class StopExecutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StopExecutionError';
    }
}

/**
 * 格式化错误信息为树形结构
 * @param {string} error - 错误信息
 * @returns {string} 格式化后的错误信息
 */
export const formatError = (error: string): string => {
    const lines = error.split('\n').filter(Boolean);
    if (lines.length === 0) return '';

    return lines
        .map((line, index) => {
            if (index === lines.length - 1) {
                return chalk.gray(`└─ ${line}`);
            }
            return chalk.gray(`├─ ${line}`);
        })
        .join('\n');
};

export const calculateCommandTime = {
    startTime: dayjs(),
    endTime: dayjs(),
    start() {
        this.startTime = dayjs();
        console.log(`${chalk.gray(`[${this.startTime.format('HH:mm:ss')}]`)} 开始执行命令`);
    },
    end() {
        this.endTime = dayjs();
        console.log(
            `${chalk.gray(`[${this.endTime.format('HH:mm:ss')}]`)} 执行命令耗时 ${chalk.magenta(timeFormatCN(this.endTime.diff(this.startTime)))}`,
        );
    },
};

/**
 * 执行单个命令
 * @param {CommandConfig} config - 命令配置
 * @param {object} options - 配置选项
 * @param {string} [options.cwd] - 运行当前命令的目录，默认是 process.cwd()
 * @throws {StopExecutionError} 当用户通过onError回调要求停止执行时抛出
 */
async function executeCommand(config: CommandConfig, options: { cwd?: string } = {}): Promise<void> {
    const cwd = options.cwd || process.cwd();
    await retryAsync(
        async () => {
            const { stdout } = await execaCommand(config.message, {
                cwd,
                stdout: 'inherit', // 直接将输出导向主进程，通常能保留颜色
                env: {
                    FORCE_COLOR: '3', // 强制启用彩色输出 (3 代表 Truecolor)
                },
                shell: true, // 启用 shell 以正确解析引号和空格
            });
            if (stdout) {
                console.log(stdout);
            }
        },
        {
            maxAttempts: config.maxAttempts || 1,
            onError: async (attempt, error) => {
                const { shouldStop = false } = (await config.onError?.(error.message)) || {};
                if (shouldStop) {
                    return {
                        shouldStop: true,
                    };
                }
                console.log(
                    `第${chalk.yellow.bold(attempt.toString())}次重复${chalk.magenta(
                        `[${dayjs().format('HH:mm:ss')}]`,
                    )}`,
                );
                console.log(formatError(error.message));
                return {
                    shouldStop: false,
                };
            },
        },
    );
}
interface ExecuateOptions {
    /**
     * 是否静默开始，不打印开始时间
     * @default false
     */
    silentStart?: boolean;
    /**
     * 运行当前命令的目录
     * @default process.cwd()
     */
    cwd?: string;
}

const commandDatabase: Command[] = [];
/**
 * 存储命令到数据库
 * @param {Command[]} commands - 命令列表
 */
export const storeCommands = (commands: Command[]) => {
    commandDatabase.push(...commands);
};
/**
 * 开始执行命令
 * @param {ExecuateOptions} [options] - 配置选项
 */
export const startExecuateCommands = async (options?: ExecuateOptions) => {
    executeCommands(commandDatabase, options);
};
/**
 * 执行命令行命令列表
 * @param {Command[]} commands - 命令列表
 * @param {ExecuateOptions} [options] - 配置选项
 * @returns {Promise<void>}
 */
export async function executeCommands(commands: Command[], options?: ExecuateOptions): Promise<void> {
    if (!options?.silentStart) {
        calculateCommandTime.start();
    }

    for (const cmd of commands) {
        const config: CommandConfig = typeof cmd === 'string' ? { message: cmd } : cmd;
        console.log(`${chalk.cyan('>')} ${chalk.yellow(config.message)}`);

        // 调试模式下仅输出命令，不实际执行
        // test
        // if (process.env.MODE === 'cliTest') {
        //     console.log(chalk.green('调试模式：跳过实际执行'));
        //     continue;
        // }

        await executeCommand(config, { cwd: options?.cwd });
    }

    if (!options?.silentStart && process.env.MODE !== 'cliTest') {
        calculateCommandTime.end();
    }
}
