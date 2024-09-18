import jwt from "jsonwebtoken";
import Time from "@/service/time";
import BaseCommand from "@/common/BaseCommand";
import { AnyObject } from "@/typings";

export interface Options {
  /**
   * 原始数据，时间戳没有解析成标准时间格式
   */
  origin?: boolean;
  /**
   * 完整数据，包括算法等
   */
  complete?: boolean;
  help?: boolean;
}

export default class extends BaseCommand {
  async main(tk: string, options: Options) {
    const tokenStr = tk.replace(/^(.+_)?/, ""); // 把前面可能有的occ_senior_去掉
    const decoded = jwt.decode(tokenStr, {
      complete: options.complete,
    }) as AnyObject; // 解析数据格式不定
    if (options.origin || decoded === null) {
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
        return {
          ...obj,
          [key]: new Time().get(decoded[key]),
        };
      }
      return {
        ...obj,
        [key]: decoded[key],
      };
    }, {});
    console.log(result);
  }
}
