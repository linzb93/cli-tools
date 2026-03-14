import { execaCommand as execa } from 'execa';
import { executeCommands } from '@/utils/promise';
import gitAtom from '../shared/utils/atom';
import { isCurrenetBranchPushed, getGitProjectStatus, GitStatusMap } from '../shared/utils';
import { logger } from '@/utils/logger';
import { DeployOptions, mergeToBranch, hasChanges } from './baseDeploy';

/**
 * 执行 Github 项目的基础 Git 命令（优先 Push 策略）
 * @param {string} commitMessage - 提交信息
 * @param {string} currentBranch - 当前分支名称
 * @returns {Promise<void>}
 */
export const executeGithubGitFlow = async (commitMessage: string, currentBranch: string): Promise<void> => {
    logger.info('执行 Github 项目基础 Git 命令 (Push First)...');

    try {
        const gitStatus = await getGitProjectStatus();

        if (gitStatus.status === GitStatusMap.Uncommitted) {
            await executeCommands(['git add .', gitAtom.commit(commitMessage)], { silentStart: true });
        }

        // 检查当前分支是否已推送到远端
        const isBranchPushed = await isCurrenetBranchPushed();

        if (!isBranchPushed) {
            // 如果是新分支，直接 push -u
            await executeCommands([gitAtom.push(true, currentBranch)], { silentStart: true });
        } else {
            // 如果已关联远程分支，尝试优先 push
            await executeCommands(
                [
                    {
                        message: 'git push',
                        maxAttempts: 3,
                        onError: async (error: string) => {
                            // 检查是否需要 pull (non-fast-forward)
                            if (
                                error.includes('updates were rejected') ||
                                error.includes('fetch first') ||
                                error.includes('contains work that you do not have locally')
                            ) {
                                logger.info('检测到远程分支有更新，正在拉取代码...');
                                try {
                                    await executeCommands([gitAtom.pull()], { silentStart: true });

                                    // 检查合并后是否有未提交的更改
                                    if (await hasChanges()) {
                                        await executeCommands(['git add .', gitAtom.commit('Merge remote changes')], {
                                            silentStart: true,
                                        });
                                    }

                                    // Pull 成功后，返回 false 让 executeCommands 重试 git push
                                    return { shouldStop: false };
                                } catch (pullError) {
                                    logger.error('拉取代码失败，请手动解决冲突');
                                    return { shouldStop: true };
                                }
                            }
                            return { shouldStop: false };
                        },
                    },
                ],
                { silentStart: true },
            );
        }

        logger.success('Github 项目基础 Git 命令执行完成');
    } catch (error) {
        logger.error('Github 项目基础 Git 命令执行失败，部署结束。');
        throw error;
    }
};

/**
 * 处理主分支的部署流程
 * @param {DeployOptions} options - 命令选项
 * @param {string} currentBranch - 当前分支
 * @returns {Promise<void>}
 */
const handleMainBranch = async (options: DeployOptions, currentBranch: string): Promise<void> => {
    // 在主分支上只需要执行基础命令
    await executeGithubGitFlow(options.commit, currentBranch);
};

/**
 * 处理非主分支的部署流程
 * @param {DeployOptions} options - 命令选项
 * @param {string} currentBranch - 当前分支
 * @param {string} mainBranch - 主分支
 * @returns {Promise<void>}
 */
const handleOtherBranch = async (options: DeployOptions, currentBranch: string, mainBranch: string): Promise<void> => {
    await executeGithubGitFlow(options.commit, currentBranch);

    // 如果指定了prod选项，合并到主分支
    if (options.prod) {
        await mergeToBranch(mainBranch, currentBranch, false);
    }
};

/**
 * Github项目部署逻辑
 * @param {DeployOptions} options - 命令选项
 * @param {string} currentBranch - 当前分支
 * @param {string} mainBranch - 主分支
 * @returns {Promise<void>}
 */
export const githubDeploy = async (
    options: DeployOptions,
    currentBranch: string,
    mainBranch: string,
): Promise<void> => {
    if (currentBranch === mainBranch) {
        await handleMainBranch(options, currentBranch);
    } else {
        await handleOtherBranch(options, currentBranch, mainBranch);
    }
};
