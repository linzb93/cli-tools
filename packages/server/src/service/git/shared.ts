import { execaCommand as execa } from 'execa';
import { isWin } from '@/common/constant';
/**
 * TODO: 打算用到代码中的git命令：
 * - 判断某个分支（假设名称为dev）是否有commit未推送：git log origin/dev..dev
 * - 推送名称为dev的分支下的所有commit，但不需要先切换到dev分支：git push origin dev
 */

/**
 * 判断是否是Git项目
 */
export const isGit = async ({ cwd = process.cwd() }): Promise<boolean> => {
    try {
        await execa('git rev-parse --is-inside-work-tree', {
            cwd,
        });
        return true;
    } catch (error) {
        return false;
    }
};

interface CloneOptions {
    url: string;
    branch?: string;
    dirName?: string;
    shallow?: false;
    cwd: string;
}

/**
 * git clone 项目
 */
export const clone = async (options: CloneOptions): Promise<string> => {
    const { url, branch, dirName, shallow, cwd } = options;
    try {
        await execa(
            `git clone${branch ? ` -b ${branch}` : ''} ${url}${dirName ? ` ${dirName}` : ''}${
                shallow ? ' --depth=1' : ''
            }`,
            {
                cwd,
                stdio: 'ignore',
            }
        );
    } catch (error) {
        throw error;
    }
    return dirName || url.split('/').slice(-1)[0].slice(0, -4);
};

/**
 * 获取远端地址
 * @returns {string} 远端地址
 */
export const remote = async (): Promise<string> => {
    const { stdout: data } = await execa('git remote -v');
    return (data.split(/\n/)[0].match(/http\S+/) as RegExpMatchArray)[0];
};

/**
 * 获取代码提交状态
 * @return { number } 未提交 1；未推送 2；已推送 3；不在master/main分支上 4；状态未知 0
 */
export const getPushStatus = async (cwd = process.cwd()): Promise<0 | 1 | 2 | 3 | 4> => {
    let stdout = '';
    try {
        const data = await execa('git status', {
            cwd,
        });
        stdout = data.stdout;
    } catch (error) {
        return 0;
    }
    if (stdout.includes('Changes not staged for commit') || stdout.includes('Changes to be committed')) {
        return 1;
    }
    if (stdout.includes('Your branch is ahead of ')) {
        return 2;
    }
    const currentBranchName = stdout.match(/On branch (\S+)/) as RegExpMatchArray;
    if (!['master', 'main'].includes(currentBranchName[1])) {
        return 4;
    }
    if (stdout.includes('nothing to commit')) {
        return 3;
    }
    return 0;
};

/**
 * 获取当前分支名称
 * @returns {string} 分支名称
 */
export const getCurrentBranch = async (): Promise<string> => {
    const { stdout } = await execa('git branch --show-current');
    return stdout;
};
/**
 * 获取最近一次提交记录
 */
export const getHeadSecondCommit = async (): Promise<string> => {
    const { stdout } = await execa('git log --format=oneline -2');
    return stdout.split('\n')[1].split(' ')[0];
};
/**
 * Git代码重置
 */
export const reset = async ({ filename, id }: { filename: string; id: string }): Promise<void> => {
    await execa(`git reset ${id} ${filename}`);
    await execa(`git checkout ${id} ${filename}`);
};

interface RemoteOptions {
    remote: boolean;
}

/**
 * 只用于git tag 和 branch
 */
export interface BranchResultItem {
    name: string;
    hasLocal: boolean;
    hasRemote: boolean;
    /**
     * 创建时间。格式：YYYY-MM-DD HH:mm:ss
     */
    createTime: string;
}

/**
 * 获取所有tag。
 * 受Git客户端限制，远端的tag只能获取部分，
 * 如果要获取所有远端的tag，需要先拉取所有tag到本地。
 */
export const getTags = async (options?: RemoteOptions): Promise<string[]> => {
    if (options?.remote) {
        await execa('git fetch --tags');
    }
    const { stdout } = await execa('git tag');
    return stdout === '' ? [] : stdout.split('\n');
};
/**
 * 删除tag
 */
export const deleteTag = async (tag: string, options?: RemoteOptions): Promise<void> => {
    if (options?.remote) {
        await execa(`git push origin :refs/tags/${tag}`, { cwd: process.cwd() });
    } else {
        await execa(`git tag -d ${tag}`, { cwd: process.cwd() });
    }
};
interface BranchOptions {
    /**
     * 分支名称关键字,支持模糊匹配
     */
    keyword?: string;
    /**
     * 是否显示创建时间
     */
    showCreateTime?: boolean;
}
/**
 * 获取分支列表,包括本地分支和远端分支。
 * 如果要获取所有远端的分支，需要先拉取所有分支到本地。
 */
export const getBranches = async (options?: BranchOptions): Promise<BranchResultItem[]> => {
    const branchSplitName = 'branch_info_split'; // Windows系统专用的分隔符，随便命名，为空的话git命令执行结果会为空。
    let command = `git branch -a --format='%(refname:short)'`;
    if (options) {
        if (options.showCreateTime) {
            command = !isWin
                ? `git branch -a --format='%(refname:short) %(creatordate:format:%Y-%m-%d %H:%M:%S)'`
                : `git branch -a --list --format=%(refname:short)${branchSplitName}%(creatordate:iso)`;
        }
        if (options.keyword) {
            command += ` | grep ${options.keyword}`;
        }
    }
    const { stdout } = await execa(command, { cwd: process.cwd(), shell: true });
    const splited = stdout.split('\n');
    return splited.reduce((acc, line) => {
        let branchName = '';
        let createTime = '';
        if (!isWin) {
            const seg = line.split(' ');
            branchName = seg[0];
            createTime = seg[1];
        } else {
            branchName = line.split(branchSplitName)[0];
            const createTimeMatch = line.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/) as RegExpMatchArray;
            createTime = createTimeMatch ? createTimeMatch[0] : '';
        }
        if (branchName === '' || branchName.startsWith('origin/HEAD')) {
            return acc;
        }
        if (!branchName.startsWith('origin/')) {
            return acc.concat({
                name: branchName,
                hasLocal: true,
                hasRemote: false,
                createTime,
            });
        }
        const localName = branchName.replace(/^origin\//, '');
        const match = acc.find((item) => item.name === localName);
        if (match) {
            match.hasRemote = true;
            return acc;
        }
        return acc.concat({
            name: localName,
            hasLocal: false,
            hasRemote: true,
            createTime,
        });
    }, []);
};

/**
 * 删除分支
 */
export const deleteBranch = async (branch: string, options?: RemoteOptions): Promise<void> => {
    if (options?.remote) {
        await execa(`git push origin -d ${branch}`, { cwd: process.cwd() });
    } else {
        await execa(`git branch -d ${branch}`, { cwd: process.cwd() });
    }
};

/**
 * 判断当前分支是否在远端有对应的分支。
 * 不需要通过远端获取，在本地获取已拉取的远端分支即可。
 */
export const isCurrenetBranchPushed = async () => {
    const current = await getCurrentBranch();
    const { stdout } = await execa(`git branch --all`);
    return stdout.split('\n').find((item) => item.includes(`remotes/origin/${current}`));
};

/**
 * 同步tag
 */
export const syncTags = async () => {
    await execa('git tag -d $(git tag -l)', { shell: true });
    await execa('git pull');
};
/**
 * 获取主分支名称
 */
export const getMasterBranchName = async () => {
    const { stdout } = await execa(`git branch`);
    return stdout.split('\n').find((line) => line.includes('master')) ? 'master' : 'main';
};
