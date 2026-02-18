import { logger } from '@/utils/logger';
import { isGitProject } from '../shared/utils';
import gitAtom from '../shared/utils/atom';
import { executeCommands } from '@/utils/promise';
import type { Options } from './types';

/**
 * git commit 命令的主入口函数
 * @param {string} message - 提交信息
 * @param {Options} options - 选项
 * @returns {Promise<void>}
 */
export const commitService = async (message: string, options: Options): Promise<void> => {
    // 检查当前目录是否是 Git 项目
    if (!(await isGitProject())) {
        logger.error('当前目录不是 Git 项目');
        return;
    }

    try {
        // 执行 git commit 命令
        await executeCommands([
            `git add ${options.path ? options.path.replace(/\\/g, '/') || '.' : '.'}`,
            gitAtom.commit(message),
        ]);
        logger.success('提交成功');
    } catch (error) {
        logger.error(`提交失败: ${error.message || error}`);
    }
};