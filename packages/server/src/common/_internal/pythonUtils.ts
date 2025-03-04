import { isWin } from '../constant';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
export const cmdName = isWin ? 'python' : 'python3';

export const parseJSON = (input: string) => {
    const str = input.replace(/'/g, '"');
    return JSON.parse(str);
};

/**
 * 获取Python执行文件的地址
 * @param path 文件名称，不含后缀名
 * @returns {string} 执行文件的地址
 */
export const getExecutePath = (path: string) => {
    return join(fileURLToPath(import.meta.url), `../../src/lib/${path}.py`);
};
