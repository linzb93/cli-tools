import dayjs from "dayjs";
import BaseCommand from "@/util/BaseCommand";
import jwt from "jsonwebtoken";

interface Options {
  origin?: boolean; // 原始数据，时间戳没有解析成标准时间格式
  complete?: boolean; // 完整数据，包括算法等
  help?: boolean;
}

class Token extends BaseCommand {
  constructor(private tokenStr: string, private options: Options) {
    super();
  }
  async run() {
    const { options } = this;
    if (options.help) {
      this.generateHelp();
      return;
    }
    const tokenStr = this.tokenStr.replace(/^occ_(senior_)?/, "");
    const decoded = jwt.decode(tokenStr, {
      complete: this.options.complete,
    }) as any; // 解析数据格式不定
    if (this.options.origin) {
      console.log(decoded);
      return decoded;
    }
    const result = Object.keys(decoded).reduce((obj, key) => {
      if (
        Number.isInteger(decoded[key]) &&
        (decoded[key].toString().length === 10 ||
          decoded[key].toString().length === 13)
      ) {
        // 可能是时间戳
        const ts =
          decoded[key].toString().length === 10
            ? decoded[key] * 1000
            : decoded[key];
        return {
          ...obj,
          [key]: dayjs(ts).format("YYYY-MM-DD HH:mm:ss"),
        };
      }
      return {
        ...obj,
        [key]: decoded[key],
      };
    }, {});
    console.log(result);
    return result;
  }
  private generateHelp() {
    this.helper.generateHelpDoc({
      title: "token",
      content: `解析token，会将时间戳转化为标准格式。
示例：
token <token>
参数：
- origin: 不转换时间戳
- complete: 获取完整的解析结果，包括算法`,
    });
  }
}

export default (data: string, options: Options) => {
  return new Token(data, options).run();
};
