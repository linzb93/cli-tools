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
    maxAttempts?: number;
    /**
     * 失败回调函数
     * @param {number} attempt - 当前重试次数
     * @param {string} error - 错误信息
     */
    onFail?: (
        attempt: number,
        error: Error,
    ) => {
        /**
         * 是否停止执行后续命令
         * @default false
         */
        shouldStop?: boolean;
    };
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
    maxAttempts?: number;
    /**
     * 错误回调函数
     * @param {string} error - 错误信息
     * @returns { { shouldStop?: boolean }} 返回对象中的shouldStop为true时停止执行
     */
    onError?: (error: string) => Promise<{
        /**
         * 是否停止执行后续命令
         * @default false
         */
        shouldStop?: boolean;
    }>;
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
            try {
                const { stdout } = await execa(config.message, { cwd });
                if (stdout) {
                    console.log(stdout);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);

                if (config.onError) {
                    const result = await config.onError(errorMessage);
                    if (result && typeof result === 'object' && result.shouldStop) {
                        throw new StopExecutionError(errorMessage);
                    }
                }

                throw error;
            }
        },
        {
            maxAttempts: config.maxAttempts || 1,
            onFail: (attempt, error) => {
                const shouldStop = error instanceof StopExecutionError;
                if (!shouldStop) {
                    console.log(
                        `第${chalk.yellow.bold(attempt.toString())}次重复${chalk.magenta(
                            `[${dayjs().format('HH:mm:ss')}]`,
                        )}`,
                    );
                    console.log(formatError(error.message));
                }
                return {
                    shouldStop,
                };
            },
        },
    );
}

/**
 * 重试执行异步函数
 * @param {() => Promise<T>} fn - 需要重试的异步函数
 * @param {RetryOptions} options - 重试选项
 * @returns {Promise<T>} 异步函数的返回值
 */
export async function retryAsync<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const { maxAttempts = 10, onFail } = options;
    let attempt = 1;

    while (attempt <= maxAttempts) {
        try {
            return await fn();
        } catch (error) {
            if (typeof onFail === 'function') {
                const { shouldStop } = onFail(attempt, error as Error);
                if (shouldStop) {
                    // 抛出和变量error一样的Error类型
                    throw error instanceof Error ? error : new Error(String(error));
                }
            }

            if (attempt === maxAttempts) {
                throw error;
            }

            attempt++;
        }
    }

    throw new Error('Maximum retry attempts reached');
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

/**
 * 执行命令行命令列表
 * @param {Command[]} commands - 命令列表
 * @param {ExecuateOptions} [options] - 配置选项
 * @returns {Promise<void>}
 */
export async function executeCommands(commands: Command[], options?: ExecuateOptions): Promise<void> {
    const startTime = dayjs();
    if (!options?.silentStart) {
        console.log(`${chalk.gray(`[${startTime.format('HH:mm:ss')}]`)} 开始执行命令`);
    }

    for (const cmd of commands) {
        const config: CommandConfig = typeof cmd === 'string' ? { message: cmd } : cmd;
        console.log(`${chalk.cyan('>')} ${chalk.yellow(config.message)}`);

        // 调试模式下仅输出命令，不实际执行
        if (process.env.MODE === 'cliTest') {
            console.log(chalk.green('调试模式：跳过实际执行'));
            continue;
        }

        try {
            await executeCommand(config, { cwd: options?.cwd });
        } catch (error) {
            if (error instanceof StopExecutionError) {
                console.log(chalk.red('命令执行已停止'));
            }
            throw error;
        }
    }

    if (!options?.silentStart && process.env.MODE !== 'cliTest') {
        const endTime = dayjs();
        const duration = endTime.diff(startTime, 'millisecond') / 1000;
        console.log(
            `${chalk.gray(`[${endTime.format('HH:mm:ss')}]`)} 任务执行完成，用时${chalk.blue(duration.toFixed(2))}秒`,
        );
    }
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
