import { isGitProject, getCurrentBranchName } from '../utils';
import gitAtom from '../utils/atom';
import { executeCommands } from '@cli-tools/shared/utils/promise';
import chalk from 'chalk';
import { logger } from '@cli-tools/shared/utils/logger';

/**
 * git pull 命令的选项接口，无需参数
 */
export interface Options {}

/**
 * git pull 命令的实现
 * @param {Options} options - 命令选项
 * @returns {Promise<void>}
 */
export const pullService = async (options: Options): Promise<void> => {
    // 检查当前目录是否是 Git 项目
    if (!(await isGitProject())) {
        logger.error('当前目录不是 Git 项目');
        return;
    }

    try {
        // 获取当前分支名称
        const currentBranch = await getCurrentBranchName();
        if (!currentBranch) {
            logger.error('无法获取当前分支名称');
            return;
        }

        logger.info(`当前分支: ${chalk.green(currentBranch)}`);

        // 显示进度提示
        logger.info('正在拉取代码...');

        // 执行 git pull 命令
        await executeCommands([gitAtom.pull()]);

        logger.success(`成功拉取分支 ${chalk.green(currentBranch)} 的最新代码`);
    } catch (error) {
        logger.error(`拉取失败: ${error.message || error}`);
    }
};
