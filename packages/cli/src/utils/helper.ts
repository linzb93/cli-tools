import { Writable } from 'node:stream';
import rawOpen from 'open';
import { sleep } from '@linzb93/utils';

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
 * 判断是否为URL
 * @param text 输入文本
 * @returns 是否为URL
 */
export const isUrl = (text: string): boolean => {
    return /^(http|https):\/\/[^ "]+$/.test(text);
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
 * 打开URL
 * @param url 要打开的URL
 * @returns {Promise<void>}
 */
export const open = async (url: string): Promise<void> => {
    await Promise.race([rawOpen(url, { wait: true }), sleep(5000)]);
};

/**
 * 时间毫秒格式化
 * @param timeMs 时间毫秒
 * @param options 选项
 * @param options.minUnitIsMinute 最小单位是否为分钟，默认false，即秒为单位单位
 * @returns 格式化后的时间字符串
 */
export const timeRemainsFormat = (
    timeMs: number,
    options?: {
        minUnitIsMinute?: boolean;
    },
) => {
    const { minUnitIsMinute = false } = options || {};
    const timeS = timeMs / 1000;
    if (timeS < 60) {
        if (minUnitIsMinute) {
            return `不到一分钟`;
        }
        return `${timeS.toFixed(2)}秒`;
    }
    const timeM = timeS / 60;
    if (timeM < 60) {
        if (minUnitIsMinute) {
            return `${parseInt(timeM.toString())}分钟`;
        }
        return `${parseInt(timeM.toString())}分钟${parseInt((timeS % 60).toString())}秒`;
    }
    const timeH = timeM / 60;
    if (minUnitIsMinute) {
        return `${parseInt(timeH.toString())}小时${parseInt((timeM % 60).toString())}分钟`;
    }
    return `${parseInt(timeH.toString())}小时${parseInt((timeM % 60).toString())}分钟${parseInt((timeS % 60).toString())}秒`;
};
