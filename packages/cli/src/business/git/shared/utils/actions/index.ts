import { executeCommands, CommandConfig } from '@/utils/execute-command-line';
import { confirm } from '@/utils/readline';
import { formatCommitMessage } from './commit';

export { formatCommitMessage };

const commit = (message: string) => {
    const fmtedMessage = formatCommitMessage(message);
    return `git commit -m ${fmtedMessage}`;
};

/**
 * 处理代码合并冲突
 * @async
 * @throws {Error} 如果用户选择不解决冲突
 */
async function handleConflict() {
    const resolved = await confirm('代码合并失败，检测到代码有冲突，是否已解决？');
    if (!resolved) {
        throw new Error('exit');
    }
    await executeCommands([
        'git add .',
        {
            message: commit('解决冲突'),
            onError: async () => {
                return {
                    shouldStop: true,
                };
            },
        },
    ]);
}
/**
 * 判断是否超时错误
 * @param {string} errMsg - 错误信息
 * @returns 是否超时错误
 */
export function isNetworkError(errMsg: string): boolean {
    return (
        errMsg.toLowerCase().includes('timeout') ||
        errMsg.includes("Couldn't connect to server") ||
        errMsg.includes('Failed') ||
        errMsg.includes('Failure') ||
        errMsg.includes('Connection reset by peer') ||
        errMsg.includes('unable to access') ||
        errMsg.includes('before end of the underlying stream')
    );
}
/**
 * 生成 Git 拉取代码命令配置
 * @returns {CommandConfig} Git 拉取代码命令配置对象
 */
function pull(): CommandConfig {
    return {
        message: 'git pull',
        maxAttempts: 100,
        onError: async (message) => ({
            shouldStop: !isNetworkError(message),
        }),
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
 * 生成 Git 合并上一个提交命令配置
 * @param {object} object - 合并上一个提交的参数
 * @param {string} object.message - 提交信息
 * @param {number} [object.head=1] - 回退的提交数量
 * @param {string} [object.path='.'] - 提交路径
 * @returns {CommandConfig[]} Git 合并上一个提交命令配置数组
 */
async function mergePrev({
    message,
    head = 1,
    path = '.',
}: {
    message: string;
    head?: number;
    path?: string;
}): Promise<CommandConfig[]> {
    return [
        {
            message: `git reset --soft HEAD~${head}`,
        },
        {
            message: `git add ${path}`,
        },
        {
            message: commit(message),
            onError: async () => {
                return {
                    shouldStop: true,
                };
            },
        },
    ];
}

/**
 * 生成 Git 推送代码命令配置
 * @param {boolean} [isLocalBranch] - 是否为本地新建分支
 * @param {string} [currenetBranchName] - 当前分支名称
 * @returns {CommandConfig} Git 推送代码命令配置对象
 */
function push(isLocalBranch?: boolean, currenetBranchName?: string): CommandConfig {
    return {
        message: isLocalBranch ? `git push --set-upstream origin ${currenetBranchName}` : 'git push',
        maxAttempts: 100,
        onError: async (errMsg) => {
            if (isNetworkError(errMsg)) {
                return {
                    shouldStop: false,
                };
            }
            return {
                shouldStop: true,
            };
        },
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
        maxAttempts: 100,
        onError: async (errMsg) => {
            if (isNetworkError(errMsg)) {
                return {
                    shouldStop: false,
                };
            }
            return {
                shouldStop: true,
            };
        },
    };
}

/**
 * 生成 Git 切换分支命令配置
 * @param {string} branch - 要切换的分支名称
 * @param {boolean} [createBranch] - 是否创建并切换到新分支
 * @returns {CommandConfig} Git 切换分支命令配置对象
 */
function checkout(branch: string, createBranch?: boolean): CommandConfig {
    return {
        message: createBranch ? `git checkout -b ${branch}` : `git checkout ${branch}`,
        onError: async () => {
            return {
                shouldStop: true,
            };
        },
    };
}

export default {
    commit,
    pull,
    merge,
    mergePrev,
    push,
    clone,
    checkout,
};
