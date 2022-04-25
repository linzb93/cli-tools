import convert from 'color-convert';
import chalk from 'chalk';
import clipboard from 'clipboardy';
import BaseCommand from '../util/BaseCommand.js';

interface Options {
  get: boolean;
}

class ColorConvert extends BaseCommand {
  private text: string;
  private options: Options;
  constructor(text: string, options: Options) {
    super();
    this.text = text;
    this.options = options;
  }
  run() {
    let { text } = this;
    let ret = convert.hex.rgb(text).join(', ');
    let blockColor = `#${text}`;
    if (this.text.startsWith('#')) {
      blockColor = text;
      text = this.text.slice(1);
      ret = convert.hex.rgb(text).join(', ');
    } else if (this.text.includes(',')) {
      text = this.text.replace(/\s/g, '');
      const arr = text.split(',').map((item) => Number(item)) as [
        number,
        number,
        number
      ];
      ret = `#${convert.rgb.hex(arr)}`;
      blockColor = ret;
    }
    if (this.options.get) {
      this.logger.success(`${chalk.hex(blockColor).bold('示例文字')}`);
      return;
    }
    this.logger.success(
      `${chalk.green('[已复制]')}${chalk.hex(blockColor).bold(ret)}`
    );
    clipboard.writeSync(ret);
  }
}

export default (text: string, options: Options) => {
  new ColorConvert(text, options).run();
};
