import { executeCommands, CommandConfig } from '@cli-tools/shared/src/utils/promise';
import inquirer from '@cli-tools/shared/src/utils/inquirer';

/**
 * 格式化提交信息，确保提交信息符合规范
 * @param {string} commit - 原始提交信息
 * @returns {string} 格式化后的提交信息
 */
export function fmtCommitMsg(rawCommit: string): string {
    let commit = rawCommit.trim().replace(/\s+/g, '-');
    if (!commit) {
        return 'feat:update';
    }
    const prefixes: {
        value: string;
        key?: string | string[];
        replaceFunction?: (commit: string) => string;
    }[] = [
        {
            value: 'feat',
        },
        {
            value: 'fix',
            key: ['修复', 'bug'],
        },
        {
            value: 'docs',
            key: '文档',
        },
        {
            value: 'style',
            key: '样式',
        },
        {
            value: 'refactor',
            key: '重构',
            replaceFunction: (commit) => commit.replace(/^重构[,|，]/, ''),
        },
        {
            value: 'test',
            key: '用例',
        },
    ];
    const match = prefixes.find((item) => commit.startsWith(`${item.value}:`));
    if (match) {
        return commit;
    }
    const match2 = prefixes.find((item) => {
        if (!item.key) {
            return false;
        }
        if (Array.isArray(item.key)) {
            return item.key.some((text) => commit.includes(text));
        }
        return commit.includes(item.key);
    });
    if (!match2) {
        return `feat:${commit}`;
    }
    if (match2.replaceFunction) {
        commit = `${match2.replaceFunction(commit)}`;
    }
    return `${match2.value}:${commit}`;
}

/**
 * 处理代码合并冲突
 * @async
 * @throws {Error} 如果用户选择不解决冲突
 */
async function handleConflict() {
    const { resolved } = await inquirer.prompt([
        {
            message: '代码合并失败，检测到代码有冲突，是否已解决？',
            type: 'confirm',
            default: true,
            name: 'resolved',
        },
    ]);
    if (!resolved) {
        throw new Error('exit');
    }
    await executeCommands(['git add .', 'git commit -m fix:conflict']);
}

/**
 * 生成 Git 提交命令配置
 * @param {string} message - 提交信息
 * @returns {CommandConfig} Git 提交命令配置对象
 */
function commit(message: string): CommandConfig {
    return {
        message: `git commit -m ${fmtCommitMsg(message)}`,
        onError: async () => {
            // await handleConflict();
            return {
                shouldStop: true,
            };
        },
    };
}

/**
 * 生成 Git 拉取代码命令配置
 * @returns {CommandConfig} Git 拉取代码命令配置对象
 */
function pull(): CommandConfig {
    return {
        message: 'git pull',
        retryTimes: 100,
        onError: async (errMsg) => {
            if (errMsg.includes('You have unstaged changes')) {
                await executeCommands(['git add .', 'git commit -m feat:update', this.pull()]);
                return {
                    shouldStop: true,
                };
            }
            return {
                shouldStop: false,
            };
        },
    };
}

/**
 * 生成 Git 合并分支命令配置
 * @param {string} branch - 要合并的分支名称
 * @returns {CommandConfig} Git 合并分支命令配置对象
 */
function merge(branch: string): CommandConfig {
    return {
        message: `git merge ${branch}`,
        onError: async () => {
            await handleConflict();
            return {
                shouldStop: true,
            };
        },
    };
}

/**
 * 生成 Git 推送代码命令配置
 * @param {boolean} [isLocalBranch] - 是否为本地新建分支
 * @param {string} [currenetBranchName] - 当前分支名称
 * @returns {CommandConfig} Git 推送代码命令配置对象
 */
function push(isLocalBranch?: boolean, currenetBranchName?: string): CommandConfig {
    if (isLocalBranch) {
        return {
            message: `git push --set-upstream origin ${currenetBranchName}`,
            retryTimes: 100,
        };
    }
    return {
        message: 'git push',
        retryTimes: 100,
    };
}

/**
 * 生成 Git 克隆命令配置
 * @param {string} repo - 远程仓库地址
 * @param {string} [dir] - 目标目录
 * @returns {CommandConfig} Git 克隆命令配置对象
 */
function clone(repo: string, dir?: string): CommandConfig {
    const cmd = dir ? `git clone ${repo} ${dir}` : `git clone ${repo}`;
    return {
        message: cmd,
        retryTimes: 100,
    };
}

export default {
    commit,
    pull,
    merge,
    push,
    clone,
};
