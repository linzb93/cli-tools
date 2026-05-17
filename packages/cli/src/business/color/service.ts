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
const getColorInfo = (input: string): { output: string; blockColor: string } => {
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
 * 解析 delta 值，支持数字或百分比
 * @param {string} delta - 输入的 delta 值
 * @returns {number} 0-1 之间的小数
 */
const parseDelta = (delta: string): number => {
    if (delta.endsWith('%')) {
        return Number.parseFloat(delta) / 100;
    }
    return Number.parseFloat(delta) / 100;
};

/**
 * Sass 风格的 lighten 函数
 * 在 HSL 空间调整亮度
 * @param {string} hex - 输入的十六进制颜色
 * @param {string} delta - 提亮百分比，支持数字或百分比
 * @returns {string} 提亮后的十六进制颜色
 * @example
 * sassLighten('#ff0', '20') // returns '#ffff66'
 * sassLighten('#ff0', '20%') // returns '#ffff66'
 */
export const sassLighten = (hex: string, delta: string): string => {
    const deltaValue = parseDelta(delta);
    let input = hex.startsWith('#') ? hex.slice(1) : hex;

    // 扩展 3 位简写十六进制
    if (input.length === 3) {
        input = input[0] + input[0] + input[1] + input[1] + input[2] + input[2];
    }

    const [h, s, l] = convert.hex.hsl(input);
    const newL = Math.min(100, l + deltaValue * 100);
    const rgb = convert.hsl.rgb([h, s, newL] as [number, number, number]);

    return `#${convert.rgb.hex(rgb as [number, number, number])}`;
};

/**
 * Sass 风格的 darken 函数
 * 在 HSL 空间调整亮度
 * @param {string} hex - 输入的十六进制颜色
 * @param {string} delta - 变暗百分比，支持数字或百分比
 * @returns {string} 变暗后的十六进制颜色
 * @example
 * sassDarken('#ff0', '20') // returns '#999900'
 * sassDarken('#ff0', '20%') // returns '#999900'
 */
export const sassDarken = (hex: string, delta: string): string => {
    const deltaValue = parseDelta(delta);
    let input = hex.startsWith('#') ? hex.slice(1) : hex;

    // 扩展 3 位简写十六进制
    if (input.length === 3) {
        input = input[0] + input[0] + input[1] + input[1] + input[2] + input[2];
    }

    const [h, s, l] = convert.hex.hsl(input);
    const newL = Math.max(0, l - deltaValue * 100);
    const rgb = convert.hsl.rgb([h, s, newL] as [number, number, number]);

    return `#${convert.rgb.hex(rgb as [number, number, number])}`;
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
    // 处理 lighten 选项
    if (options.lighten !== undefined) {
        const result = sassLighten(input, options.lighten);
        logger.success(`${chalk.hex(result).bold(result)}`);
        clipboard.writeSync(result);
        return;
    }

    // 处理 darken 选项
    if (options.darken !== undefined) {
        const result = sassDarken(input, options.darken);
        logger.success(`${chalk.hex(result).bold(result)}`);
        clipboard.writeSync(result);
        return;
    }

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
