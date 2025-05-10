import convert from 'color-convert';
import chalk from 'chalk';
import clipboard from 'clipboardy';
import BaseCommand from '../BaseCommand';
export interface Options {
    get: boolean;
    help?: boolean;
}

export default class extends BaseCommand {
    constructor() {
        super();
    }
    main(text: string, options: Options) {
        let ret = convert.hex.rgb(text).join(', ');
        let blockColor = `#${text}`;
        if (text.startsWith('#')) {
            blockColor = text;
            text = text.slice(1);
            ret = convert.hex.rgb(text).join(', ');
        } else if (text.includes(',')) {
            text = text.replace(/\s/g, '');
            const colorNumberList = text.split(',').map((item) => Number(item)) as [number, number, number];
            ret = `#${convert.rgb.hex(colorNumberList)}`;
            blockColor = ret;
        }
        if (options.get) {
            this.logger.success(`${chalk.hex(blockColor).bold('示例文字')}`);
            return;
        }
        if (process.env.VITEST) {
            return ret;
        }
        this.logger.success(`${chalk.green('[已复制]')}${chalk.hex(blockColor).bold(ret)}`);
        clipboard.writeSync(ret);
    }
}
