import { Writable } from 'node:stream';
import clipboardy from 'clipboardy';
import chalk from 'chalk';
import notifier from 'node-notifier';
import logger from './logger';
import { Command } from 'commander';

export const copy = (text: string) => {
    clipboardy.writeSync(text);
};
export const readCopy = () => {
    return clipboardy.readSync();
};
/**
 * 发送系统通知
 */
export const notify = (content: string) => {
    notifier.notify({
        title: 'cli通知',
        message: content,
    });
};

interface HelpDocOptions {
    title: string;
    content: string;
}

/**
 * 生成命令帮助文档
 */
export const generateHelpDoc = (options: HelpDocOptions) => {
    logger.box({
        title: `${options.title}命令帮助文档`,
        borderColor: 'green',
        padding: 1,
        content: options.content,
    });
};
/**
 * 显示提示，在发生外部错误的时候使用
 */
export const showWeakenTips = (mainTitle: string, tips: string): string => {
    const tipsSeg = tips.split(/\n/);
    const formattedTips = tipsSeg
        .map((line, index, list) => {
            if (index === list.length - 1) {
                return `└─ ${line}`;
            }
            return `├─ ${line}`;
        })
        .join('\n');
    return `${mainTitle}\n${chalk.gray(formattedTips)}`;
};

export const isURL = (text: string) => !!text.match(/^https?\:\/\//);
/**
 * 按行分割文件。
 * @param {string} fileContent 文件内容
 * @returns {string[]} 分割后的文件内容数组
 */
export const splitByLine = (fileContent: string): string[] => {
    const eol = fileContent.includes('\r\n') ? '\r\n' : '\n';
    return fileContent === '' ? [] : fileContent.split(eol);
};
/**
 * 空的写入流
 */
export const emptyWritableStream = new Writable({
    write(data, enc, callback) {
        callback();
    },
});
/**
 * 判断一个字符串是否是本地路径，兼容Windows和macOS系统
 */
export const isPath = (value: string): boolean => {
    return value.startsWith('/') || /[CDEFGHI]\:.+/.test(value) || value.startsWith('./') || value.startsWith('../');
};
/**
 * 用于TypeScript类型判断中
 * @param {string | number | symbol} key object的key
 * @param {object} object 用于判断的object
 * @returns {boolean}
 */
export function isValidKey(key: string | number | symbol, object: object): key is keyof typeof object {
    // is 是类型谓词
    return key in object;
}

/**
 * 注册子命令
 * @param fn
 * @param options
 */
export const subCommandCompiler = (fn: (cmd: Command) => void) => {
    const program = new Command();
    fn(program);
    program.parse(process.argv.filter((item, index) => index !== 2 && item !== '--debug'));
};
