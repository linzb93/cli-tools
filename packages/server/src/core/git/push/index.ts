import BaseCommand from '../../BaseCommand';
import { isGitProject, getCurrentBranchName, isCurrenetBranchPushed } from '../utils';
import gitAtom from '../utils/atom';
import { executeCommands } from '@/utils/promise';
import chalk from 'chalk';

/**
 * git push 命令的实现类
 */
export class PushManager extends BaseCommand {
    /**
     * 命令的主入口函数
     * @returns {Promise<void>}
     */
    async main(): Promise<void> {
        // 检查当前目录是否是 Git 项目
        if (!(await isGitProject())) {
            this.logger.error('当前目录不是 Git 项目');
            return;
        }

        try {
            // 获取当前分支名称
            const currentBranch = await getCurrentBranchName();
            if (!currentBranch) {
                this.logger.error('无法获取当前分支名称');
                return;
            }

            this.logger.info(`当前分支: ${chalk.green(currentBranch)}`);

            // 显示进度提示
            this.logger.info('正在推送代码...');

            // 根据 force 参数确定是否设置上游分支
            if (await isCurrenetBranchPushed()) {
                await executeCommands([gitAtom.push()]);
                this.logger.success(`成功将分支 ${chalk.green(currentBranch)} 推送到远程`);
            } else {
                await executeCommands([gitAtom.push(false, currentBranch)]);
                this.logger.success(`成功将分支 ${chalk.green(currentBranch)} 推送到远程并设置上游分支`);
            }
        } catch (error) {
            this.logger.error(`推送失败: ${error.message || error}`);
        }
    }
}
