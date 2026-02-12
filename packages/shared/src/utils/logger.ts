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
    const filename = `${year}Q${quarter}.json`;
    const targetFilename = resolve(cacheRoot, 'track', filename);

    // 构建新的记录
    const newRecord = {
        time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        nodejsVersion: process.version,
        command: content.trim(),
    };

    let records: Array<{ time: string; nodejsVersion: string; command: string }> = [];

    // 如果文件已存在，读取现有记录
    if (fs.existsSync(targetFilename)) {
        try {
            const fileContent = fs.readFileSync(targetFilename, 'utf8');
            if (fileContent.trim()) {
                records = JSON.parse(fileContent);
            }
        } catch (error) {
            // 如果解析失败，从空数组开始
            console.warn('读取现有日志文件失败，创建新文件:', error);
        }
    }

    // 添加新记录
    records.push(newRecord);

    // 写回文件
    try {
        fs.writeFileSync(targetFilename, JSON.stringify(records, null, 2), 'utf8');
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
};
