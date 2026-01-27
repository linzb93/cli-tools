import { map, first, from, concatMap, interval } from 'rxjs';
import { Writable } from 'node:stream';
import { logger } from '../utils/logger';
import { findContent } from './markdown';
import { fromStream } from './rxjs';
import { lt } from 'semver';

/**
 * 按行分割文件。
 * @param {string} fileContent 文件内容
 * @returns {string[]} 分割后的文件内容数组
 */
export const splitByLine = (fileContent: string): string[] => {
    const eol = fileContent.includes('\r\n') ? '\r\n' : '\n';
    return fileContent === '' ? [] : fileContent.split(eol);
};
export const isURL = (text: string) => !!text.match(/^https?\:\/\//);
/**
 * 空的写入流
 */
export const emptyWritableStream = new Writable({
    write(data, enc, callback) {
        callback();
    },
});
/**
 * 将对象转换为命令行选项字符串数组
 * @param obj 一个键值对对象，键为选项名称，值为选项的值
 * @returns 返回一个字符串数组，每个元素代表一个命令行选项
 *
 * 此函数遍历对象的键，将键和值转换为命令行参数的形式
 * 如果值为布尔类型且为true，则只返回键名；否则返回键名加等号加值的形式
 * 这是为了适应某些命令行工具对参数的特定格式要求
 */
export const objectToCmdOptions = (obj: Record<string, any>) => {
    return Object.keys(obj)
        .map((key) => {
            // 当值为true时，生成只带选项名称的命令行参数
            if (obj[key] === true) {
                return `--${key}`;
            }
            if (obj[key] === false || obj[key] === undefined || obj[key] === null) {
                return '';
            }
            // 当值不为true时，生成带选项名称和值的命令行参数
            return `--${key}=${obj[key]}`;
        })
        .filter(Boolean);
};
/**
 * 旧版本NodeJS，这里指的是NodeJS 14.
 */
export const isOldNode = lt(process.version, '18.0.0');
/**
 * 生成命令帮助文档
 */
export const generateHelpDoc = (commands: string[]) => {
    return new Promise<void>(async (resolve) => {
        try {
            const stream = findContent({
                moduleName: commands[0],
                title: commands[1],
            });
            fromStream(stream)
                .pipe(
                    map((data) => `${data.toString()}\n`),
                    concatMap((line) =>
                        from(line.split('')).pipe(
                            concatMap((char) =>
                                interval(100).pipe(
                                    first(),
                                    map(() => char)
                                )
                            )
                        )
                    )
                )
                .subscribe({
                    next(data) {
                        process.stdout.write(data);
                    },
                    complete: () => {
                        resolve();
                    },
                });
        } catch (error) {
            logger.error(`没有找到${commands.join(' ')}的帮助文档`);
            resolve();
        }
    });
};

/**
 * 默认浏览器请求头，避免被网站识别非浏览器访问而禁止。
 */
export const defaultBrowserHeaders = {
    'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
};
