import { execaCommand as execa } from 'execa';
import { cmdName, getExecutePath } from './_internal/pythonUtils';
import sql from './sql';
const pythonExecutePath = getExecutePath('dialog');

/**
 * 打开文件系统弹窗，支持单选/多选文件和单选文件夹
 * @param {string} type - file:单个文件；files:多个文件；directory:单个文件夹
 * @returns {Promise<string>} 选择的文件/文件夹地址
 */
export const showOpenDialog = async (type: 'file' | 'files' | 'directory'): Promise<string> => {
    const root = await sql((db) => db.open.root);
    const { stdout } = await execa(`${cmdName} ${pythonExecutePath} --type=${type} --root="${root}"`);
    return stdout;
};

/**
 * 打开文件保存弹窗
 * @returns {Promise<string>}
 */
export const showSaveDialog = async (): Promise<string> => {
    const { stdout } = await execa(`${cmdName} ${pythonExecutePath} --type=save`);
    return stdout;
};
