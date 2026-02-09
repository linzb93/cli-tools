import convert from 'color-convert';
import chalk from 'chalk';
import clipboard from 'clipboardy';
import { logger } from '../../utils/logger';

export interface Options {
    /**
     * 是否显示颜色示例
     */
    get: boolean;
    /**
     * 是否显示帮助文档
     */
    help?: boolean;
}

/**
 * 颜色映射表
 */
const COLOR_MAP: Record<string, string> = {
    red: '#ff0000',
    yellow: '#ffff00',
    orange: '#ffa500',
    blue: '#0000ff',
    lightBlue: '#add8e6',
    green: '#00ff00',
    lightGreen: '#90ee90',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    white: '#ffffff',
    black: '#000000',
    pink: '#ffc0cb',
    purple: '#800080',
};

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
    if (COLOR_MAP[input]) {
        const output = COLOR_MAP[input];
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
