import chalk from 'chalk';
import dayjs from 'dayjs';
import { execaCommand as execa } from 'execa';
import { retryAsync } from './promise';

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
                const { stdout } = await execa(config.message, { cwd, stripColor: false });
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
