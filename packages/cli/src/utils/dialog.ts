import { execaCommand as execa } from 'execa';
import { cmdName, getExecutePath } from '@cli-tools/shared';
import { readSecret } from '@cli-tools/shared/node';
const pythonFileDialogExecutePath = getExecutePath('file-dialog');

/**
 * 打开文件系统弹窗，支持单选/多选文件和单选文件夹
 * @param {string} type - file:单个文件；files:多个文件；directory:单个文件夹
 * @returns {Promise<string>} 选择的文件/文件夹地址
 */
export const showOpenDialog = async (type: 'file' | 'files' | 'directory'): Promise<string> => {
    const root = await readSecret((db) => db.open.root);
    const { stdout } = await execa(`${cmdName} ${pythonFileDialogExecutePath} --type=${type} --root="${root}"`);
    return stdout;
};

/**
 * 打开文件保存弹窗
 * @returns {Promise<string>}
 */
export const showSaveDialog = async (): Promise<string> => {
    const { stdout } = await execa(`${cmdName} ${pythonFileDialogExecutePath} --type=save`);
    return stdout;
};

const pythonSystemDialogExecutePath = getExecutePath('system-dialog');

/**
 * 显示系统消息弹窗
 * @param {string} title - 弹窗标题
 * @param {string} message - 弹窗消息内容
 */
export const showMessageDialog = async (title: string, message: string): Promise<void> => {
    await execa(`${cmdName} ${pythonSystemDialogExecutePath} --title="${title}" --message="${message}"`);
};
