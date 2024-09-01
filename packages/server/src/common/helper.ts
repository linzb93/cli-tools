import clipboardy from "clipboardy";
import notifier from "node-notifier";
import { Writable } from "node:stream";
import logger from "./logger";
import chalk from "chalk";

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
