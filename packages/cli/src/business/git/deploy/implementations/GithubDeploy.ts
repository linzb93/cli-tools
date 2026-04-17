import { BaseDeploy } from '../core/BaseDeploy';
import { getContext } from '../shared';
import { isCurrenetBranchPushed, getGitProjectStatus, GitStatusMap } from '../../shared/utils';
import { executeCommands } from '@/utils/execuate-command-line';
import gitActions, { isNetworkError } from '../../shared/utils/actions';
import { logger } from '@/utils/logger';

export class GithubDeploy extends BaseDeploy {
    async start(): Promise<void> {
        const options = getContext();
        const { currentBranch, mainBranch } = options;
        if (currentBranch === mainBranch) {
            await this.handleMainBranch();
        } else {
            await this.handleOtherBranch();
        }
    }
    /**
     * 执行 Github 项目的基础 Git 命令（优先 Push 策略）
     * @returns {Promise<void>}
     */
    private async executeGithubGitFlow(): Promise<void> {
        const context = getContext();
        try {
            const gitStatus = await getGitProjectStatus(context.cwd);

            if (gitStatus.status === GitStatusMap.Uncommitted) {
                await executeCommands(['git add .', gitActions.commit(context.commit)], {
                    cwd: context.cwd,
                    silentStart: true,
                });
            }

            // 检查当前分支是否已推送到远端
            const isBranchPushed = await isCurrenetBranchPushed(context.cwd);

            if (!isBranchPushed) {
                // 如果是新分支，直接 push -u
                await executeCommands([gitActions.push(true, context.currentBranch)], {
                    cwd: context.cwd,
                    silentStart: true,
                });
            } else {
                // 如果已关联远程分支，尝试优先 push
                await executeCommands(
                    [
                        {
                            message: 'git push',
                            maxAttempts: 3,
                            onError: async (err: string) => {
                                // 检查是否需要 pull (non-fast-forward)
                                if (isNetworkError(err)) {
                                    try {
                                        await executeCommands([gitActions.pull()], {
                                            cwd: context.cwd,
                                            silentStart: true,
                                        });

                                        // 检查合并后是否有未提交的更改
                                        const status = await getGitProjectStatus(context.cwd);
                                        if (status.status === GitStatusMap.Uncommitted) {
                                            await executeCommands(
                                                ['git add .', gitActions.commit('Merge remote changes')],
                                                {
                                                    silentStart: true,
                                                    cwd: context.cwd,
                                                },
                                            );
                                        }

                                        // Pull 成功后，返回 false 让 executeCommands 重试 git push
                                        return { shouldStop: false };
                                    } catch (pullError) {
                                        return { shouldStop: true };
                                    }
                                }
                                return { shouldStop: false };
                            },
                        },
                    ],
                    { cwd: context.cwd, silentStart: true },
                );
            }
        } catch (error) {
            logger.error('Github 项目基础 Git 命令执行失败，部署结束。');
            throw error;
        }
    }
    /**
     * 处理主分支的部署流程
     * @returns {Promise<void>}
     */
    private async handleMainBranch(): Promise<void> {
        // 在主分支上只需要执行基础命令
        await this.executeGithubGitFlow();
    }

    /**
     * 处理非主分支的部署流程
     * @returns {Promise<void>}
     */
    private async handleOtherBranch(): Promise<void> {
        const context = getContext();

        await this.executeGithubGitFlow();

        // 如果指定了prod选项，合并到主分支
        if (context.prod) {
            await this.mergeToBranch(context.mainBranch, false);
        }
    }
}
