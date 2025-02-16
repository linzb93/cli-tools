import { sequenceExec } from '@/common/promiseFn';
import inquirer from '@/common/inquirer';

function fmtCommitMsg(commit: string) {
    if (!commit) {
        return 'feat:update';
    }
    const prefixes = ['feat:', 'fix:', 'docs:', 'style:', 'refactor:', 'test:', 'chore:'];
    const match = prefixes.find((item) => commit.startsWith(item));
    if (match) {
        return commit;
    }
    if (['修复', 'bug'].some((text) => commit.includes(text))) {
        return `fix:${commit}`;
    }
    if (commit.includes('重构')) {
        return `refactor:${commit}`;
    }
    if (commit.includes('用例')) {
        return `test:${commit}`;
    }
    return `feat:${commit}`;
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
    await sequenceExec(['git add .', 'git commit -m conflict-fixed']);
}

const gitAtom = {
    commit(message: string) {
        return {
            message: `git commit -m ${fmtCommitMsg(message)}`,
            onError: handleConflict,
        };
    },
    pull() {
        return {
            message: 'git pull',
            onError: () => {},
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
        };
    },
    merge(branch: string) {
        return {
            message: `git merge ${branch}`,
            onError: handleConflict,
        };
    },
};
export default gitAtom;
