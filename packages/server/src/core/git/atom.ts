import { executeCommands, CommandConfig } from '@/utils/promise';
import inquirer from '@/utils/inquirer';

function fmtCommitMsg(commit: string) {
    if (!commit) {
        return 'feat:update';
    }
    const prefixes: {
        value: string;
        key?: string | string[];
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
    return `${match2.value}:${commit}`;
}

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

const gitAtom: {
    [key: string]: (...data: any[]) => CommandConfig;
} = {
    commit(message: string) {
        return {
            message: `git commit -m ${fmtCommitMsg(message)}`,
        };
    },
    pull() {
        return {
            message: 'git pull',
            onError: (errMsg) => {
                if (errMsg.includes('You have unstaged changes')) {
                    executeCommands(['git add .', 'git commit -m feat:update', this.pull()]);
                    return {
                        shouldStop: true,
                    };
                }
                return {
                    shouldStop: false,
                };
            },
        };
    },
    push(isLocalBranch?: boolean, currenetBranchName?: string) {
        if (isLocalBranch) {
            return {
                message: `git push --set-upstream origin ${currenetBranchName}`,
            };
        }
        return {
            message: 'git push',
            onError: (message) => {
                if (['pull', 'merge'].some((text) => message.includes(text))) {
                    executeCommands([this.pull(), this.push()]);
                    return {
                        shouldStop: true,
                    };
                }
                return {
                    shouldStop: true,
                };
            },
        };
    },
    merge(branch: string) {
        return {
            message: `git merge ${branch}`,
            onError: () => {
                handleConflict();
                return {
                    shouldStop: true,
                };
            },
        };
    },
};
export default gitAtom;
