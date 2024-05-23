/* eslint-disable indent */
import fs from "fs-extra";
import { Writable } from "node:stream";
import path from "node:path";
import { Low, JSONFile } from "lowdb";
import { execaCommand as execa } from "execa";
import { fileURLToPath } from "node:url";
import logger from "./logger";
import { pick } from "lodash-es";
import chalk from "chalk";
import axios from "axios";
import dayjs from "dayjs";
import os from "node:os";
import ValidatorSchema, { Rules as ValidatorRules } from "async-validator";

export const isWin = process.platform === "win32";

export const isURL = (text: string): boolean => {
  return text.startsWith("http://") || text.startsWith("https://");
};

// 判断一个字符串是否是本地路径
export const isPath = (value: string): boolean => {
  return (
    value.startsWith("/") ||
    /[CDEFGHI]\:.+/.test(value) ||
    value.startsWith("./") ||
    value.startsWith("../")
  );
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

export const root = process.cwd();

export const download = (src: string, dest: string) => {
  const ws = fs.createWriteStream(dest);
  return new Promise((resolve) => {
    axios({
      url: src,
      responseType: "stream",
    }).then((res) => {
      res.data.pipe(ws);
    });
    ws.on("finish", () => {
      resolve(null);
    });
  });
};
export const openInEditor = async (
  project: string,
  options?: {
    isGoto?: boolean;
    reuse?: boolean;
  }
): Promise<void> => {
  try {
    await execa(
      `code ${options?.isGoto ? "-g" : ""} ${project} ${
        options?.reuse ? "-r" : ""
      }`
    );
  } catch (cmdError) {
    try {
      await fs.access(project);
    } catch (accessError) {
      logger.error("项目路径不存在");
      return;
    }
    logger.error("打开失败，未检测到有安装VSCode");
  }
};

export function isValidKey(
  key: string | number | symbol,
  object: object
): key is keyof typeof object {
  // is 是类型谓词
  return key in object;
}

// 获取快捷方式文件夹的真实地址
export const getOriginPath = async (rawPath: string): Promise<string> => {
  // await requireDynamic('macos-alias');
  return rawPath;
};

export const isEmptyObject = (value: any) => {
  // eslint-disable-next-line no-unused-vars
  for (const key of value) {
    return false;
  }
  return true;
};

export const sleep = (time: number): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

export const splitByLine = (str: string): string[] => {
  const eol = str.includes("\r\n") ? "\r\n" : "\n";
  return str === "" ? [] : str.split(eol);
};

export const processArgvToFlags = (
  options: object,
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

export const pickAndRename = (src: string, maps: object) => {
  const rawData = pick(src, ...Object.keys(maps)) as unknown as object;
  const data = {};
  for (const key in maps) {
    if (
      isValidKey(key, maps) &&
      isValidKey(maps[key], data) &&
      isValidKey(key, rawData)
    ) {
      data[maps[key]] = rawData[key];
    }
  }
  return data;
};

export const isInVSCodeTerminal = process.env.TERM_PROGRAM === "vscode";

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

export const emptyWritableStream = new Writable({
  write(data, enc, callback) {
    callback();
  },
});

export const desktop = (() => {
  if (isWin) {
    return `${os.homedir()}/DESKTOP`;
  } else {
    return os.homedir();
  }
})();

export const log = async (content: string) => {
  const real = `\n[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] ${content}`;
  await fs.appendFile("debug.log", real);
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

interface HelpDocSubTitle {
  title: string;
  description: string;
  options?: {
    title: string;
    description: string;
  }[];
}

// 异步循环操作，直到满足条件退出。（不要删掉，目前还没用到，我不知道代码能放哪里）
// exports.until = async function until(
//     params, // 异步函数的参数
//     pCallback, // 异步函数
//     endCondition, // 结束循环条件
//     changeParams // 不满足结束条件时参数发生的变化
// ) {
//     let res;
//     let cond = false;
//     while (!cond) {
//         res = await pCallback(params);
//         cond = endCondition(res);
//         params = changeParams(params);
//     }
// };
