import jwt from "jsonwebtoken";
import timestampFormat from '@/commands/time';
import BaseCommand from "@/util/BaseCommand";
import { AnyObject } from "@/util/types";

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
    const tokenStr = this.tokenStr.replace(/^(.+_)?/, "");
    const decoded = jwt.decode(tokenStr, {
      complete: this.options.complete,
    }) as AnyObject; // 解析数据格式不定
    if (this.options.origin || decoded === null) {
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
        const timestamp = decoded[key];
        return {
          ...obj,
          [key]: timestampFormat(timestamp),
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
