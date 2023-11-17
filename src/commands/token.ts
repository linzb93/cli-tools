import dayjs from 'dayjs';
import BaseCommand from '../util/BaseCommand.js';
import jwt from 'jsonwebtoken';

interface Options {
  origin: boolean; // 原始数据，时间戳没有解析成标准时间格式
  complete: boolean; // 完整数据，包括算法等
}

class Token extends BaseCommand {
  private tokenStr: string;
  private options: Options;
  constructor(tokenStr: string, options: Options) {
    super();
    this.tokenStr = tokenStr;
    this.options = options;
  }
  async run() {
    const decoded = jwt.decode(this.tokenStr, {
      complete: this.options.complete
    }) as any;
    if (this.options.origin) {
      console.log(decoded);
      return;
    }
    console.log(
      Object.keys(decoded).reduce((obj, key) => {
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
      }, {})
    );
  }
}

export default (data: string, options: Options) => {
  new Token(data, options).run();
};
