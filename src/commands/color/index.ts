import convert from "color-convert";
import chalk from "chalk";
import clipboard from "clipboardy";
import BaseCommand from "@/util/BaseCommand";

interface Options {
  get: boolean;
}

class ColorConvert extends BaseCommand {
  constructor(private text: string, private options: Options) {
    super();
  }
  run() {
    let { text } = this;
    let destColor = '';
    let blockColor = `#${text}`;
    if (this.text.startsWith("#")) {
      // hex格式的，形如`#fff`
      blockColor = text;
      text = this.text.slice(1);
      destColor = convert.hex.rgb(text).join(", ");
    } else if (this.text.includes(",")) {
      // rgb格式的，形容`22,33,22`
      text = this.text.replace(/\s/g, "");
      const colorNumberList = text.split(",").map((item) => Number(item)) as [
        number,
        number,
        number
      ];
      destColor = `#${convert.rgb.hex(colorNumberList)}`;
      blockColor = destColor;
    }
    if (this.options.get) {
      this.logger.success(`${chalk.hex(blockColor).bold("示例文字")}`);
      return;
    }
    if (process.env.VITEST) {
      return destColor;
    }
    this.logger.success(
      `${chalk.green("[已复制]")}${chalk.hex(blockColor).bold(destColor)}`
    );
    clipboard.writeSync(destColor);
  }
}
/**
 * eg: mycli color '#fff' or mycli color '255,255,255'
 */
export default (text: string, options: Options) => {
  return new ColorConvert(text, options).run();
};
