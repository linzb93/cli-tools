import readline from 'node:readline';
import { resolve } from 'node:path';
import chalk from 'chalk';
import dayjs from 'dayjs';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';
import terminalSize from 'terminal-size';
import stringWidth from 'string-width';
import spinner from './spinner';
import { cacheRoot } from './constant';

interface BoxOptions {
    title?: string;
    borderColor: string;
    padding?: number;
    content: string;
}

/**
 * 日志处理类，提供输出日志、命令行交互相关功能
 */
class Logger {
    /**
     * 内部函数，用于处理 spinner 状态
     * @param callback - 需要执行的回调函数
     */
    private hook(callback: () => void): void {
        let isStop = false;
        if (spinner.isSpinning) {
            spinner.stop();
            isStop = true;
        }
        if (process.env.VITEST) {
            return;
        }
        callback();
        if (isStop) {
            spinner.start();
        }
    }

    /**
     * 输出成功信息
     * @param text - 要输出的文本或数字
     */
    success(text: string | number): void {
        this.hook(() => {
            console.log(`${logSymbols.success} ${text}`);
        });
    }

    /**
     * 输出普通信息
     * @param text - 要输出的文本或数字
     */
    info(text: string | number): void {
        this.hook(() => {
            console.log(`${logSymbols.info} ${text}`);
        });
    }

    /**
     * 输出警告信息
     * @param text - 要输出的文本或数字
     */
    warn(text: string | number): void {
        this.hook(() => {
            console.log(`${logSymbols.warning} ${text}`);
        });
    }

    /**
     * 输出错误信息
     * @param text - 要输出的文本或数字
     * @param needExit - 是否需要退出进程
     */
    error(text: string | number, needExit?: boolean): void {
        this.hook(() => {
            console.log(`${logSymbols.error} ${text}`);
        });
        if (needExit) {
            process.exit(1);
        }
    }

    /**
     * 清除控制台
     * @param start - 开始清除的位置
     * @param clearAll - 是否清除所有内容
     */
    clearConsole(start = 0, clearAll?: boolean): void {
        if (process.stdout.isTTY) {
            if (!clearAll) {
                const blank = '\n'.repeat(process.stdout.rows);
                console.log(blank);
            }
            readline.cursorTo(process.stdout, 0, start);
            readline.clearScreenDown(process.stdout);
        }
    }

    /**
     * 控制台光标回退一行
     */
    backwardConsole(): void {
        if (process.stdout.isTTY) {
            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine(0);
        }
    }

    /**
     * 显示边框盒子，替代原来的boxen
     * @param options - 盒子选项
     */
    box(options: BoxOptions): void {
        const { columns } = terminalSize();
        const title = chalk.bgRed.white(` ${options.title} `);
        const titleEdgeLength = Math.floor((columns - stringWidth(title)) / 2);
        console.log(
            `${chalk[options.borderColor](`-`.repeat(titleEdgeLength))}${title}${chalk[options.borderColor](
                `-`.repeat(titleEdgeLength)
            )}`
        );
        if (options.padding) {
            for (let i = 0; i < options.padding; i++) {
                console.log('');
            }
        }
        console.log(options.content);
        if (options.padding) {
            for (let i = 0; i < options.padding; i++) {
                console.log('');
            }
        }
        console.log(chalk[options.borderColor](`-`.repeat(columns)));
    }

    /**
     * 记录CLI日志到文件
     * @param content - 日志内容
     */
    cli(content: string): void {
        fs.appendFile(resolve(cacheRoot, 'track.txt'), `[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${content}\n`);
    }

    /**
     * 记录Web服务器日志到文件
     * @param content - 日志内容
     */
    web(content: string): void {
        fs.appendFile(resolve(cacheRoot, 'serverLog.txt'), `[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${content}\n`);
    }
}

// 创建并导出Logger类的实例
export const logger = new Logger();

// 默认导出Logger类
export default Logger;
