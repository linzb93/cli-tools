import convert from "color-convert";
import chalk from "chalk";
import clipboard from "clipboardy";
import BaseCommand from "@/common/BaseCommand";
import * as helper from "@/common/helper";
export interface Options {
  get: boolean;
  help?: boolean;
}

export default class extends BaseCommand {
  constructor() {
    super();
  }
  main(text: string, options: Options) {
    if (options.help) {
      this.generateHelp();
      return;
    }
    let ret = convert.hex.rgb(text).join(", ");
    let blockColor = `#${text}`;
    if (text.startsWith("#")) {
      blockColor = text;
      text = text.slice(1);
      ret = convert.hex.rgb(text).join(", ");
    } else if (text.includes(",")) {
      text = text.replace(/\s/g, "");
      const colorNumberList = text.split(",").map((item) => Number(item)) as [
        number,
        number,
        number
      ];
      ret = `#${convert.rgb.hex(colorNumberList)}`;
      blockColor = ret;
    }
    if (options.get) {
      this.logger.success(`${chalk.hex(blockColor).bold("示例文字")}`);
      return;
    }
    if (process.env.VITEST) {
      return ret;
    }
    this.logger.success(
      `${chalk.green("[已复制]")}${chalk.hex(blockColor).bold(ret)}`
    );
    clipboard.writeSync(ret);
  }
  private generateHelp() {
    helper.generateHelpDoc({
      title: "color",
      content: `转换颜色显示
color '#333' => '51,51,51'
color '255,255,255' => '#fff'`,
    });
  }
}
