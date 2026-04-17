import { executeCommands, CommandConfig } from '@/utils/execuate-command-line';
import inquirer from '@/utils/inquirer';

/**
 * 格式化提交信息，确保提交信息符合规范
 * @param {string} rawCommit - 原始提交信息
 * @returns {string} 格式化后的提交信息
 */
export function formatCommitMessage(rawCommit: string): string {
    let commit = rawCommit.trim().replace(/\s+/g, '-');
    if (!commit) {
        return 'feat:update';
    }
    const prefixes: {
        value: string;
        key?: string | string[];
    }[] = [
        {
            value: 'revert',
            key: ['回滚', '撤销'],
        },
        {
            value: 'docs',
            key: ['文档', '注释', 'readme'],
        },
        {
            value: 'style',
            key: ['样式', '格式', 'prettier', 'eslint'],
        },
        {
            value: 'perf',
            key: ['性能', '速度', 'perf', 'performance', 'speed'],
        },
        {
            value: 'test',
            key: ['测试', '用例', 'test', 'case', 'spec', 'e2e', 'unit', 'coverage'],
        },
        {
            value: 'build',
            key: ['构建', '依赖', 'build', 'dependencies', 'npm', 'pnpm', 'webpack', 'vite', 'rollup'],
        },
        {
            value: 'ci',
            key: ['ci', 'workflow', 'pipeline', 'action', 'jenkins', 'travis', 'circle', 'github actions'],
        },
        {
            value: 'chore',
            key: ['杂项', '工具', '配置', 'chore', 'tool', 'config', 'settings', '.gitignore', 'package.json'],
        },
        {
            value: 'refactor',
            key: ['重构', '优化', 'refactor', 'improve', 'optimize', '迁移'],
        },
        {
            value: 'fix',
            key: ['修复', 'bug', 'fix', '解决', '问题', 'issue'],
        },
        {
            value: 'feat',
            key: ['新增', '功能', 'feature', 'new', 'feat', '添加', 'implement'],
        },
    ];
    // 1. 检查是否已有标准前缀 (如 feat:、fix: 等)
    const hasStandardPrefix = prefixes.find((item) => commit.startsWith(`${item.value}:`));
    if (hasStandardPrefix) {
        return commit;
    }

    // 2. 通过关键字匹配推断应使用的前缀
    const inferredPrefix = prefixes.find((item) => {
        if (!item.key) {
            return false;
        }
        if (Array.isArray(item.key)) {
            return item.key.some((text) => commit.includes(text));
        }
        return commit.includes(item.key);
    });

    // 3. 无匹配时默认使用 feat
    if (!inferredPrefix) {
        return `feat:${commit}`;
    }
    return `${inferredPrefix.value}:${commit}`;
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
    await executeCommands(['git add .', commit('解决冲突')]);
}
/**
 * 判断是否超时错误
 * @param {string} errMsg - 错误信息
 * @returns 是否超时错误
 */
function isNetworkError(errMsg: string): boolean {
    console.log(errMsg);
    return (
        errMsg.toLowerCase().includes('timeout') ||
        errMsg.includes("Couldn't connect to server") ||
        errMsg.includes('Failed to connect to') ||
        errMsg.includes('Connection reset by peer') ||
        errMsg.includes('unable to access') ||
        errMsg.includes('before end of the underlying stream')
    );
}
/**
 * 生成 Git 提交命令配置
 * @param {string} message - 提交信息
 * @returns {CommandConfig} Git 提交命令配置对象
 */
function commit(message: string): CommandConfig {
    return {
        message: `git commit -m ${formatCommitMessage(message)}`,
        onError: async () => {
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
        maxAttempts: 100,
        onError: async (errMsg) => {
            if (errMsg.includes('You have unstaged changes')) {
                await executeCommands(['git add .', 'git commit -m feat:update', pull()]);
                return {
                    shouldStop: true,
                };
            }
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
    push,
    clone,
    checkout,
};
