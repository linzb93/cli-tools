import chalk from 'chalk';
import dayjs from 'dayjs';
import { execaCommand as execa } from 'execa';

/**
 * 重试选项接口
 */
interface RetryOptions {
    /**
     * 最大重试次数
     * @default 10
     */
    times?: number;
    /**
     * 失败回调函数
     * @param {number} attempt - 当前重试次数
     * @param {string} error - 错误信息
     */
    onFail?: (attempt: number, error: string) => void;
}

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
    retryTimes?: number;
    /**
     * 错误回调函数
     * @param {string} error - 错误信息
     * @returns {void | { shouldStop?: boolean }} 返回对象中的shouldStop为true时停止执行
     */
    onError?: (error: string) => void | {
        /**
         * 是否停止执行后续命令
         * @default false
         */
        shouldStop?: boolean;
    };
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
const formatError = (error: string): string => {
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

/**
 * 执行单个命令
 * @param {CommandConfig} config - 命令配置
 * @throws {StopExecutionError} 当用户通过onError回调要求停止执行时抛出
 */
async function executeCommand(config: CommandConfig): Promise<void> {
    await retryAsync(
        async () => {
            try {
                await execa(config.message, { shell: true });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);

                if (config.onError) {
                    const result = config.onError(errorMessage);
                    if (result && typeof result === 'object' && result.shouldStop) {
                        throw new StopExecutionError('Command execution stopped by user');
                    }
                }

                throw error;
            }
        },
        {
            times: config.retryTimes || 10,
            onFail: (attempt, error) => {
                console.log(`第${chalk.yellow.bold(attempt.toString())}次重复`);
                console.log(formatError(error));
            },
        }
    );
}

/**
 * 重试执行异步函数
 * @param {() => Promise<T>} fn - 需要重试的异步函数
 * @param {RetryOptions} options - 重试选项
 * @returns {Promise<T>} 异步函数的返回值
 */
export async function retryAsync<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const { times = 10, onFail } = options;
    let attempt = 1;

    while (attempt <= times) {
        try {
            return await fn();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            if (onFail) {
                onFail(attempt, errorMessage);
            }

            if (attempt === times) {
                throw error;
            }

            attempt++;
        }
    }

    throw new Error('Maximum retry attempts reached');
}

/**
 * 执行命令行命令列表
 * @param {Command[]} commands - 命令列表
 * @returns {Promise<void>}
 */
export async function executeCommands(commands: Command[]): Promise<void> {
    const startTime = dayjs();
    console.log(`${startTime.format('YYYY-MM-DD HH:mm:ss')} 开始执行命令`);

    for (const cmd of commands) {
        const config: CommandConfig = typeof cmd === 'string' ? { message: cmd } : cmd;
        console.log(`${chalk.cyan('>')} ${chalk.yellow(config.message)}`);

        try {
            await executeCommand(config);
        } catch (error) {
            if (error instanceof StopExecutionError) {
                console.log(chalk.red('命令执行已停止'));
                break;
            }
            throw error;
        }
    }

    const endTime = dayjs();
    const duration = endTime.diff(startTime, 'second');
    console.log(`任务执行完成，用时${chalk.blue(duration.toString())}秒`);
}
/**
 * 按顺序执行异步函数，返回第一个成功的结果
 * @param list
 * @param callback
 * @returns
 */
export const pLocate = async (list: any[], callback: Function): Promise<any> => {
    for (let i = 0; i < list.length; i++) {
        try {
            return await callback(list[i]);
        } catch (error) {
            //
        }
    }
    throw new Error('err');
};
