import convert from 'color-convert';
import chalk from 'chalk';
import clipboard from 'clipboardy';
import BaseCommand from '../BaseCommand';
export interface Options {
    get: boolean;
    help?: boolean;
}

export default class extends BaseCommand {
    private colorMap = {
        red: '#ff0000',
        yellow: '#ffff00',
        orange: '#ffa500',
        blue: '#0000ff',
        lightBlue: '#add8e6',
        green: '#008000',
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
    main(input: string, options: Options) {
        if (this.colorMap[input]) {
            const output = this.colorMap[input];
            this.logger.success(`${chalk.green('[已复制]')}${chalk.hex(output).bold(output)}`);
            clipboard.writeSync(output);
            return;
        }
        const { output, blockColor } = this.getColorInfo(input);
        if (options.get) {
            this.logger.success(`${chalk.hex(blockColor).bold('示例文字')}`);
            return;
        }
        this.logger.success(`${chalk.green('[已复制]')}${chalk.hex(blockColor).bold(output)}`);
        clipboard.writeSync(output);
    }
    getTranslatedColor(input: string) {
        const { output } = this.getColorInfo(input);
        return output;
    }
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
