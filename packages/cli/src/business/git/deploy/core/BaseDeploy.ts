import { executeCommands } from '@/utils/execuate-command-line';
import gitActions from '../../shared/utils/actions';
import { isCurrenetBranchPushed, getGitProjectStatus, GitStatusMap } from '../../shared/utils';
import { getContext } from '../shared';
import { logger } from '@/utils/logger';

export abstract class BaseDeploy {
    abstract start(): Promise<void>;
    async executeBaseManagers() {
        const context = getContext();
        let gitStatus = await getGitProjectStatus(context.cwd);
        if (gitStatus.status === GitStatusMap.Uncommitted) {
            await executeCommands(['git add .', gitActions.commit(context.commit)], {
                cwd: context.cwd,
                silentStart: true,
            });
        }
        // 检查当前分支是否已推送到远端
        let isBranchPushed = await isCurrenetBranchPushed(context.cwd);
        // 根据分支推送状态决定是否添加 pull 命令
        if (isBranchPushed) {
            await executeCommands([gitActions.pull()], { cwd: context.cwd, silentStart: true });
        }
        // 检查Pull后是否有未提交的更改（如合并产生的未提交更改）
        gitStatus = await getGitProjectStatus(context.cwd);
        if (gitStatus.status === GitStatusMap.Uncommitted) {
            await executeCommands(['git add .', gitActions.commit('合并代码')], {
                cwd: context.cwd,
                silentStart: true,
            });
        }
        // 根据分支是否已推送到远端决定push方式
        await executeCommands([isBranchPushed ? gitActions.push() : gitActions.push(true, context.currentBranch)], {
            cwd: context.cwd,
            silentStart: true,
        });
    }
    /**
     * 合并到指定分支
     * @param {string} targetBranch - 目标分支
     * @param {boolean} [switchBackToBranch=false] - 是否切换回原分支
     * @returns {Promise<void>}
     */
    protected async mergeToBranch(targetBranch: string, switchBackToBranch: boolean = false): Promise<void> {
        const context = getContext();
        const cwd = context.cwd;
        const { currentBranch } = context;

        try {
            // 保存当前分支
            await executeCommands(
                [
                    gitActions.checkout(targetBranch),
                    gitActions.pull(),
                    gitActions.merge(currentBranch),
                    gitActions.push(),
                ],
                {
                    cwd,
                    silentStart: true,
                },
            );

            // 根据参数决定是否切回原分支
            if (switchBackToBranch) {
                await executeCommands([gitActions.checkout(currentBranch)], { cwd, silentStart: true });
            }
        } catch (error) {
            // 如果需要切换回原始分支，并且出现错误
            if (switchBackToBranch) {
                try {
                    await executeCommands([gitActions.checkout(currentBranch)], { cwd, silentStart: true });
                } catch (checkoutError) {
                    logger.error('切回原始分支失败');
                }
            }

            logger.error(`合并到 ${targetBranch} 分支失败`);
            throw error;
        }
    }
}
