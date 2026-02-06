import { logger } from '@cli-tools/shared/utils/logger';
import { isGitProject, getCurrentBranchName, isCurrenetBranchPushed } from '../shared/utils';
import gitAtom from '../shared/utils/atom';
import { executeCommands } from '@cli-tools/shared/utils/promise';
import chalk from 'chalk';

/**
 * git push 命令的实现
 * @returns {Promise<void>}
 */
export const pushService = async (): Promise<void> => {
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
        logger.info('正在推送代码...');

        // 根据 force 参数确定是否设置上游分支
        if (await isCurrenetBranchPushed()) {
            await executeCommands([gitAtom.push()]);
            logger.success(`成功将分支 ${chalk.green(currentBranch)} 推送到远程`);
        } else {
            await executeCommands([gitAtom.push(false, currentBranch)]);
            logger.success(`成功将分支 ${chalk.green(currentBranch)} 推送到远程并设置上游分支`);
        }
    } catch (error: any) {
        logger.error(`推送失败: ${error.message || error}`);
    }
};
