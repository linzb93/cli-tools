import dayjs from 'dayjs';
import BaseCommand from '../../util/BaseCommand.js';
import jwt from 'jsonwebtoken';

interface Options {
  origin?: boolean; // 原始数据，时间戳没有解析成标准时间格式
  complete?: boolean; // 完整数据，包括算法等
}

class Token extends BaseCommand {
  constructor(private tokenStr: string, private options: Options) {
    super();
  }
  async run() {
    const tokenStr = this.tokenStr.replace(/^occ_(senior_)?/, '');
    const decoded = jwt.decode(tokenStr, {
      complete: this.options.complete
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
          [key]: dayjs(ts).format('YYYY-MM-DD HH:mm:ss')
        };
      }
      return {
        ...obj,
        [key]: decoded[key]
      };
    }, {});
    console.log(result);
    return result;
  }
}

export default (data: string, options: Options) => {
  return new Token(data, options).run();
};
