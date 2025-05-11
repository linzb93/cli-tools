import BaseCommand from '../../BaseCommand';
import { isGitProject, getCurrentBranchName } from '../utils';
import gitAtom from '../atom';
import { executeCommands } from '@/utils/promise';
import chalk from 'chalk';

/**
 * git push 命令的选项接口
 */
export interface Options {
    /**
     * 是否强制推送
     * @default false
     */
    force?: boolean;
}

/**
 * git push 命令的实现类
 */
export default class extends BaseCommand {
    /**
     * 命令的主入口函数
     * @param {Options} options - 命令选项
     * @returns {Promise<void>}
     */
    async main(options: Options): Promise<void> {
        const { force = false } = options;

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
            if (force) {
                await executeCommands([gitAtom.push(true, currentBranch)]);
                this.logger.success(`成功将分支 ${chalk.green(currentBranch)} 推送到远程并设置上游分支`);
            } else {
                await executeCommands([gitAtom.push()]);
                this.logger.success(`成功将分支 ${chalk.green(currentBranch)} 推送到远程`);
            }
        } catch (error) {
            this.logger.error(`推送失败: ${error.message || error}`);
        }
    }
}
