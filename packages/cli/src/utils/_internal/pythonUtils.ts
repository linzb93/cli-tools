import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { isWin } from '@cli-tools/shared/constant';

export const cmdName = isWin ? 'python' : 'python3';

export const parseJSON = (input: string) => JSON.parse(input.replace(/'/g, '"'));

/**
 * 获取Python执行文件的地址
 * @param path 文件名称，不含后缀名
 * @returns {string} 执行文件的地址
 */
export const getExecutePath = (path: string, withExtName = true): string =>
    join(fileURLToPath(import.meta.url), `../../src/lib/${path}${withExtName ? '.py' : ''}`);
