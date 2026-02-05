import convert from 'color-convert';
import chalk from 'chalk';
import clipboard from 'clipboardy';
import { BaseService } from '@cli-tools/shared/src/base/BaseService';
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

export class ColorService extends BaseService {
    /**
     * 颜色映射表
     */
    private colorMap = {
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
    constructor() {
        super();
    }

    /**
     * 主函数，处理颜色转换和输出
     * @param {string} input - 输入的颜色值
     * @param {Options} options - 选项
     */
    main(input: string, options: Options) {
        const { output, blockColor } = this.getColorInfo(input);
        if (this.colorMap[input]) {
            const output = this.colorMap[input];
            this.logger.success(`${chalk.green('[已复制]')}${chalk.hex(output).bold(output)}`);
            clipboard.writeSync(output);
            return;
        }
        if (options.get) {
            this.logger.success(`${chalk.hex(blockColor).bold('示例文字')}`);
            return;
        }
        this.logger.success(`${chalk.green('[已复制]')}${chalk.hex(blockColor).bold(output)}`);
        clipboard.writeSync(output);
    }
    /**
     * 获取转换后的颜色值。单元测试用
     * @param {string} input - 输入的颜色值
     * @returns {string} 转换后的颜色值
     * @example
     * getTranslatedColor('#ff0000') // returns '255, 0, 0'
     */
    getTranslatedColor(input: string) {
        const { output } = this.getColorInfo(input);
        return output;
    }

    /**
     * 获取颜色信息
     * @param {string} input - 输入的颜色值
     * @returns {{output: string, blockColor: string}} 颜色信息对象
     */
    private getColorInfo(input: string) {
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
    }
}
