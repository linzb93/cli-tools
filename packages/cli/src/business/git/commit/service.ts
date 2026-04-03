import { logger } from '@/utils/logger';
import { execaCommand } from 'execa';
import { isGitProject } from '../shared/utils';
import gitActions from '../shared/utils/actions';
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

    // 既没有输入提交信息，也没有 --merge 选项
    if (!message && !options.merge) {
        logger.error('请输入提交信息或使用 --merge 选项');
        process.exit(1);
    }

    try {
        // 执行 git add 命令
        await executeCommands([`git add ${options.path ? options.path.replace(/\\/g, '/') || '.' : '.'}`]);

        // 如果是 --merge 选项，使用上一条提交信息 amend
        if (options.merge && !message) {
            await execaCommand('git commit --amend --no-edit');
        } else {
            await executeCommands([gitActions.commit(message)]);
        }
        logger.success('提交成功');
    } catch (error) {
        logger.error(`提交失败: ${(error as Error).message}`);
    }
};
