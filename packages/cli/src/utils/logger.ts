import readline from 'node:readline';
import { resolve } from 'node:path';
import chalk from 'chalk';
import dayjs from 'dayjs';
import cfonts from 'cfonts';
import fs from 'fs-extra';
import tinycolor from 'tinycolor2';
import gradientUtil from 'gradient-string';
import logSymbols from 'log-symbols';
import terminalSize from 'terminal-size';
import stringWidth from 'string-width';
import spinner from './spinner';
import { cacheRoot } from '@cli-tools/shared';

interface BoxOptions {
    title?: string;
    borderColor: string;
    padding?: number;
    content: string;
}

/**
 * 在日志输出前处理 spinner 状态
 * @returns 是否需要在输出后重新启动 spinner
 */
const beforeLog = (): boolean => {
    if (process.env.VITEST) {
        return false;
    }

    let isStop = false;
    if (spinner.isSpinning) {
        spinner.stop();
        isStop = true;
    }
    return isStop;
};

/**
 * 在日志输出后恢复 spinner 状态
 * @param needRestart - 是否需要重新启动 spinner
 */
const afterLog = (needRestart: boolean): void => {
    if (needRestart) {
        spinner.start();
    }
};

/**
 * 输出成功信息
 * @param text - 要输出的文本或数字
 */
const success = (text: string | number): void => {
    const needRestart = beforeLog();
    console.log(`${logSymbols.success} ${text}`);
    afterLog(needRestart);
};

/**
 * 输出普通信息
 * @param text - 要输出的文本或数字
 */
const info = (text: string | number): void => {
    const needRestart = beforeLog();
    console.log(`${logSymbols.info} ${text}`);
    afterLog(needRestart);
};

/**
 * 输出警告信息
 * @param text - 要输出的文本或数字
 */
const warn = (text: string | number): void => {
    const needRestart = beforeLog();
    console.log(`${logSymbols.warning} ${text}`);
    afterLog(needRestart);
};

/**
 * 输出错误信息
 * @param text - 要输出的文本或数字
 * @param needExit - 是否需要退出进程
 */
const error = (text: string | number, needExit?: boolean): void => {
    const needRestart = beforeLog();
    console.log(`${logSymbols.error} ${text}`);
    afterLog(needRestart);

    if (needExit) {
        process.exit(1);
    }
};

/**
 * 清除控制台
 * @param start - 开始清除的位置
 * @param clearAll - 是否清除所有内容
 */
const clearConsole = (start = 0, clearAll?: boolean): void => {
    if (process.stdout.isTTY) {
        if (!clearAll) {
            const blank = '\n'.repeat(process.stdout.rows);
            console.log(blank);
        }
        readline.cursorTo(process.stdout, 0, start);
        readline.clearScreenDown(process.stdout);
    }
};

/**
 * 控制台光标回退一行
 */
const backwardConsole = (times = 1): void => {
    if (process.stdout.isTTY) {
        for (let i = 0; i < times; i++) {
            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine(0);
        }
    }
};

/**
 * 显示边框盒子，替代原来的boxen
 * @param options - 盒子选项
 */
const box = (options: BoxOptions): void => {
    const { columns } = terminalSize();
    const title = chalk.bgRed.white(` ${options.title} `);
    const titleEdgeLength = Math.floor((columns - stringWidth(title)) / 2);
    // @ts-ignore
    console.log(
        // @ts-ignore
        `${chalk[options.borderColor](`-`.repeat(titleEdgeLength))}${title}${chalk[options.borderColor](
            `-`.repeat(titleEdgeLength),
        )}`,
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
    // @ts-ignore
    console.log(chalk[options.borderColor](`-`.repeat(columns)));
};

/**
 * 记录CLI日志到文件（JSON格式）
 * @param content - 日志内容（命令）
 */
const cli = (content: string): void => {
    // 获取当前时间的年份和季度
    const year = dayjs().format('YYYY');
    const quarter = Math.ceil(Number(dayjs().format('MM')) / 3);
    const filename = `${year}Q${quarter}.log`;
    const targetFilename = resolve(cacheRoot, 'track', filename);

    const time = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const command = content.trim();
    const logLine = `[${time}] ${command}\n`;

    // 追加到文件
    try {
        fs.appendFileSync(targetFilename, logLine, 'utf8');
    } catch (error) {
        console.error('写入日志文件失败:', error);
    }
};

/**
 * 记录Web服务器日志到文件
 * @param content - 日志内容
 */
const web = (content: string): void => {
    fs.appendFile(resolve(cacheRoot, 'serverLog.txt'), `[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${content}\n`);
};

const logDebug = (content: string): void => {
    if (process.env.MODE === 'cliTest') {
        console.log(chalk.bgBlue.white(` ${content} `));
    }
};
const big = (
    text: string,
    options?: {
        color: string;
    },
): void => {
    cfonts.say(text, {
        font: 'block',
        colors: [options?.color || 'red'],
        background: 'transparent',
    });
};
const gradient = (text: string): void => {
    const coolGradient = gradientUtil([
        tinycolor('#FFBB65'),
        { r: 0, g: 255, b: 0 },
        { h: 240, s: 1, v: 1, a: 1 },
        'rgb(120, 120, 0)',
        'gold',
    ]);
    console.log(coolGradient(text));
};

export const logger = {
    success,
    info,
    warn,
    error,
    clearConsole,
    backwardConsole,
    box,
    cli,
    web,
    debug: logDebug,
    big,
    gradient,
};
