import convert from 'color-convert';
import chalk from 'chalk';
import clipboard from 'clipboardy';
import { logger } from '@/utils/logger';
import type { Options } from './types';
import { COLOR_MAP } from '@/constant';

/**
 * 获取颜色信息
 * @param {string} input - 输入的颜色值
 * @returns {{output: string, blockColor: string}} 颜色信息对象
 */
const getColorInfo = (input: string) => {
    let ret = convert.hex.rgb(input).join(', ');
    let blockColor = `#${input}`;
    if (input.startsWith('#')) {
        blockColor = input;
        input = input.slice(1);
        ret = convert.hex.rgb(input).join(', ');
    } else if (input.includes(',')) {
        input = input.replace(/\s/g, '');
        const colorNumberList = input.split(',').map((item) => Number(item)) as [number, number, number];
        ret = `#${convert.rgb.hex(colorNumberList)}`;
        blockColor = ret;
    }
    return {
        output: ret,
        blockColor,
    };
};

/**
 * 获取转换后的颜色值。单元测试用
 * @param {string} input - 输入的颜色值
 * @returns {string} 转换后的颜色值
 * @example
 * getTranslatedColor('#ff0000') // returns '255, 0, 0'
 */
export const getTranslatedColor = (input: string) => {
    const { output } = getColorInfo(input);
    return output;
};

/**
 * 主函数，处理颜色转换和输出
 * @param {string} input - 输入的颜色值
 * @param {Options} options - 选项
 */
export const colorService = (input: string, options: Options) => {
    const { output, blockColor } = getColorInfo(input);
    if (COLOR_MAP[input as keyof typeof COLOR_MAP]) {
        const output = COLOR_MAP[input as keyof typeof COLOR_MAP];
        logger.success(`${chalk.green('[已复制]')}${chalk.hex(output).bold(output)}`);
        clipboard.writeSync(output);
        return;
    }
    if (options.get) {
        logger.success(`${chalk.hex(blockColor).bold('示例文字')}`);
        return;
    }
    logger.success(`${chalk.green('[已复制]')}${chalk.hex(blockColor).bold(output)}`);
    clipboard.writeSync(output);
};
