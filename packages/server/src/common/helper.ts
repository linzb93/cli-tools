import clipboardy from "clipboardy";
import notifier from "node-notifier";
import { Writable } from "node:stream";
import path from "node:path";
import logger from "./logger";
import chalk from "chalk";
import { AnyObject } from "./types";
import { Low, JSONFile } from "lowdb";
import { root } from "./constant";
import ValidatorSchema, { Rules as ValidatorRules } from "async-validator";

export const isWin = process.platform !== "darwin";
export const copy = (text: string) => {
  clipboardy.writeSync(text);
};
export const readCopy = () => {
  return clipboardy.readSync();
};
export const notify = (content: string) => {
  notifier.notify({
    title: "店客多通知",
    message: content,
  });
};

interface HelpDocOptions {
  title: string;
  content: string;
}

export const generateHelpDoc = (options: HelpDocOptions) => {
  logger.box({
    title: `${options.title}命令帮助文档`,
    borderColor: "green",
    padding: 1,
    content: options.content,
  });
};
export const showWeakenTips = (mainTitle: string, tips: string): string => {
  const tipsSeg = tips.split(/\n/);
  const formattedTips = tipsSeg
    .map((line, index, list) => {
      if (index === list.length - 1) {
        return `└─ ${line}`;
      }
      return `├─ ${line}`;
    })
    .join("\n");
  return `${mainTitle}\n${chalk.gray(formattedTips)}`;
};

export const validate = (obj: any, descriptor: ValidatorRules): void => {
  const Schema = (ValidatorSchema as any).default;
  const validator = new Schema(descriptor);
  validator.validate(obj, (errors: Error, fields: any) => {
    if (!errors) {
      return;
    }
    const target = fields[Object.keys(fields)[0]];
    logger.error(`${chalk.red("[参数验证不通过]")} ${target[0].message}`);
    process.exit(1);
  });
};
export const isURL = (text: string): boolean => {
  return text.startsWith("http://") || text.startsWith("https://");
};
/**
 * 按行分割文件。
 * @param {string} fileContent 文件内容
 * @returns {string[]} 分割后的文件内容数组
 */
export const splitByLine = (fileContent: string): string[] => {
  const eol = fileContent.includes("\r\n") ? "\r\n" : "\n";
  return fileContent === "" ? [] : fileContent.split(eol);
};
export const emptyWritableStream = new Writable({
  write(data, enc, callback) {
    callback();
  },
});
// 判断一个字符串是否是本地路径
export const isPath = (value: string): boolean => {
  return (
    value.startsWith("/") ||
    /[CDEFGHI]\:.+/.test(value) ||
    value.startsWith("./") ||
    value.startsWith("../")
  );
};
/**
 * 用于TypeScript类型判断中
 * @param {string | number | symbol} key object的key
 * @param {object} object 用于判断的object
 * @returns {boolean}
 */
export function isValidKey(
  key: string | number | symbol,
  object: object
): key is keyof typeof object {
  // is 是类型谓词
  return key in object;
}
/**
 * 将对象转换成命令行参数格式
 * @param {object} options 输入的对象
 * @param {boolean} isStr 是否将对象转成字符串，否则就是数组
 * @returns
 */
export const processArgvToFlags = (
  options: AnyObject,
  isStr?: boolean
): string | string[] => {
  const ret = Object.keys(options).map((opt) => {
    if (isValidKey(opt, options)) {
      if (options[opt] === true) {
        return `--${opt}`;
      }
      return `--${opt}=${options[opt]}`;
    }
    return "";
  });
  return isStr ? ret.join(" ") : ret;
};

/**
 * 创建本地数据库文件实例
 * @param {string} pathName 数据库文件地址，支持放在嵌套文件夹里
 * @returns {Low} 数据库实例
 */
export const createDB = (pathName: string): Low => {
  const url = pathName.includes(".")
    ? `data/${pathName.replace(/\./g, "/")}.json`
    : `data/${pathName}.json`;
  const adapter = new JSONFile(path.resolve(root, url));
  return new Low(adapter);
};
