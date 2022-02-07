import * as fs from 'fs-extra';
import path from 'path';
import { execaCommand as execa } from 'execa';
import logger from './logger.js';
import lodash from 'lodash';
import chalk from 'chalk';
import windowsShortcuts from 'windows-shortcuts';
import ValidatorSchema, {
  Rules as ValidatorRules,
  ValidateSource,
  FieldErrorList
} from 'async-validator';
const { pick } = lodash;

export const isWin = process.platform === 'win32';

export const isURL = (text: string): boolean => {
  return text.startsWith('http://') || text.startsWith('https://');
};

// 判断一个字符串是否是本地路径
export const isPath = (value: string): boolean => {
  return (
    value.startsWith('/') ||
    /[CDEFGHI]\:.+/.test(value) ||
    value.startsWith('./') ||
    value.startsWith('../')
  );
};

export const validate = (
  obj: ValidateSource,
  descriptor: ValidatorRules
): void => {
  const Schema = (ValidatorSchema as any).default;
  const validator = new Schema(descriptor);
  validator.validate(obj, (errors: Error, fields: FieldErrorList) => {
    if (!errors) {
      return;
    }
    const target = fields[Object.keys(fields)[0]];
    logger.error(`${chalk.red('[参数验证不通过]')} ${target[0].message}`);
    process.exit(1);
  });
};

export const parseImportUrl = (url: string) =>
  decodeURI(url.replace(isWin ? 'file:///' : 'file://', ''));

export const root = path.join(parseImportUrl(import.meta.url), '../../../');

export const openInEditor = async (project: string): Promise<void> => {
  try {
    await execa(`code ${project}`);
  } catch (cmdError) {
    try {
      await fs.access(project);
    } catch (accessError) {
      logger.error('项目路径不存在');
      return;
    }
    logger.error('打开失败，未检测到有安装VSCode');
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
  if (isWin) {
    return await new Promise((resolve) => {
      // 如果ts编译报错，把shortcut依赖的.ts文件删掉
      windowsShortcuts.query(rawPath, (err, lnk) => {
        if (err) {
          resolve(rawPath);
        } else {
          resolve(lnk.target || rawPath);
        }
      });
    });
  }
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
  const eol = str.includes('\r\n') ? '\r\n' : '\n';
  return str === '' ? [] : str.split(eol);
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
  });
  return isStr ? ret.join(' ') : (ret as unknown as string);
};

export const pickAndRename = (src: string, maps: object) => {
  const rawData = pick(src, ...Object.keys(maps));
  const data = {};
  for (const key in maps) {
    // @ts-ignore
    if (
      isValidKey(key, maps) &&
      isValidKey(maps[key], data) &&
      // @ts-ignore
      isValidKey(key, rawData)
    ) {
      // @ts-ignore
      data[maps[key]] = rawData[key];
    }
  }
  return data;
};

// // 异步循环操作，直到满足条件退出。（不要删掉，目前还没用到，我不知道代码能放哪里）
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
