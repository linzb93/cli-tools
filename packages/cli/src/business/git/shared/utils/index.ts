import dayjs from 'dayjs';
import { execaCommand as execa } from 'execa';

/**
 * 判断指定路径是否是 Git 项目
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @returns {Promise<boolean>} 是否为 Git 项目
 */
export async function isGitProject(projectPath: string = process.cwd()): Promise<boolean> {
    try {
        await execa(`git rev-parse --is-inside-work-tree`, { cwd: projectPath });
        return true;
    } catch {
        return false;
    }
}

/**
 * 获取指定项目的当前分支名称
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @returns {Promise<string>} 分支名称
 */
export async function getCurrentBranchName(projectPath: string = process.cwd()): Promise<string> {
    try {
        const { stdout } = await execa(`git rev-parse --abbrev-ref HEAD`, { cwd: projectPath });
        return stdout.trim();
    } catch {
        return '';
    }
}

export enum GitStatusMap {
    Unknown = 0,
    Uncommitted = 1,
    Unpushed = 2,
    Pushed = 3,
    NotOnMainBranch = 4,
}

/**
 * 获取指定 Git 项目的状态
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @returns {Promise<{ status: number; branchName: string }>} 状态码
 *
 * - status: 状态码
 * - 0: 状态未知
 * - 1: 未提交
 * - 2: 未推送
 * - 3: 已推送
 * - 4: 不在 master/main 分支上
 * - branchName: 分支名称
 */
export async function getGitProjectStatus(projectPath: string = process.cwd()): Promise<{
    status: number;
    branchName: string;
}> {
    const output = {
        status: 0,
        branchName: '',
    };
    if (!(await isGitProject(projectPath))) {
        return output;
    }
    const branchName = await getCurrentBranchName(projectPath);
    output.branchName = branchName;

    try {
        const { stdout } = await execa('git status', {
            cwd: projectPath,
        });
        if (stdout.includes('Changes not staged for commit') || stdout.includes('Changes to be committed')) {
            output.status = GitStatusMap.Uncommitted;
            return output;
        }
        if (stdout.includes('Your branch is ahead of ')) {
            output.status = GitStatusMap.Unpushed;
            return output;
        }
        // 检查是否在 master/main 分支
        if (!['master', 'main'].includes(branchName)) {
            output.status = GitStatusMap.NotOnMainBranch;
            return output;
        }
        if (stdout.includes('nothing to commit')) {
            output.status = GitStatusMap.Pushed;
            return output;
        }

        return output;
    } catch (error) {
        output.status = GitStatusMap.Unknown;
        return output;
    }
}

/**
 * 获取指定 Git 项目的远端地址
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @returns {Promise<string>} 远端地址
 */
export async function getRemoteUrl(projectPath: string = process.cwd()): Promise<string> {
    try {
        const { stdout } = await execa(`git config --get remote.origin.url`, { cwd: projectPath });
        return stdout.trim();
    } catch {
        return '';
    }
}

/**
 * 获取指定项目的所有 tag
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @returns {Promise<string[]>} tag 列表
 */
export async function getAllTags(projectPath: string = process.cwd()): Promise<string[]> {
    try {
        const { stdout } = await execa(`git tag`, { cwd: projectPath });
        return stdout.trim().split('\n').filter(Boolean);
    } catch {
        return [];
    }
}

/**
 * 删除指定项目的部分 tag
 * @param {Object} params - 删除 tag 的参数
 * @param {string[]} params.tags - 要删除的 tag 列表
 * @param {string} [params.projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @param {boolean} [params.remote=false] - 是否删除远端 tag
 * @returns {Promise<void>}
 */
export async function deleteTags({
    tags,
    projectPath = process.cwd(),
    remote = false,
}: {
    tags: string[];
    projectPath?: string;
    remote?: boolean;
}): Promise<void> {
    const deletePromises = tags.map(async (tag) => {
        // 删除本地 tag
        await execa(`git tag -d ${tag}`, { cwd: projectPath });

        // 如果需要删除远端 tag
        if (remote) {
            await execa(`git push origin :refs/tags/${tag}`, { cwd: projectPath });
        }
    });

    await Promise.all(deletePromises);
}

/**
 * 包含本地和远端状态的分支信息
 */
export interface BranchInfo {
    /**
     * 分支名称
     */
    name: string;
    /**
     * 是否有本地分支
     * @default false
     */
    hasLocal: boolean;
    /**
     * 是否有远端分支
     * @default false
     */
    hasRemote: boolean;
    /**
     * 创建时间（第一次提交时间），仅本地分支有效
     * @default ""
     */
    createTime: string;
}

/**
 * 获取指定项目的所有分支（本地和远端）
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @returns {Promise<BranchInfo[]>} 包含本地和远端状态的分支信息列表
 */
export async function getAllBranches(projectPath: string = process.cwd()): Promise<BranchInfo[]> {
    try {
        // 获取本地分支
        const { stdout: localOutput } = await execa(`git branch`, { cwd: projectPath });
        const localBranches = localOutput
            .trim()
            .split('\n')
            .filter(Boolean)
            .map((line) => line.trim().replace(/^\*\s*/, ''));

        // 获取远端分支
        const { stdout: remoteOutput } = await execa(`git branch -r`, { cwd: projectPath });
        const remoteBranches = remoteOutput
            .trim()
            .split('\n')
            .filter(Boolean)
            .map((line) => line.trim())
            .filter((branch) => !branch.includes('HEAD'))
            .map((branch) => {
                // 通常远端分支格式为 "origin/branch-name"，需要提取分支名
                const parts = branch.split('/');
                return parts.length > 1 ? parts.slice(1).join('/') : branch;
            });

        // 合并本地和远端分支
        const allBranchNames = [...new Set([...localBranches, ...remoteBranches])];

        // 构建结果对象
        const branchPromises = allBranchNames.map(async (name) => {
            const isLocal = localBranches.includes(name);
            const isRemote = remoteBranches.includes(name);

            // 只为本地分支获取创建时间
            let createTime = '';
            if (isLocal) {
                createTime = await getBranchFirstCommitTime(name, projectPath);
            }

            return {
                name,
                hasLocal: isLocal,
                hasRemote: isRemote,
                createTime: createTime ? dayjs(createTime).format('YYYY-MM-DD') : '无',
            };
        });

        return await Promise.all(branchPromises);
    } catch (error) {
        console.warn(`获取分支列表失败：${error}`);
        return [];
    }
}

/**
 * 删除分支的配置选项
 */
interface DeleteBranchOptions {
    /**
     * 要删除的分支名称
     */
    branchName: string;

    /**
     * 项目路径，默认为当前工作目录
     * @default process.cwd()
     */
    projectPath?: string;

    /**
     * 是否删除远端分支
     * @default false
     */
    remote?: boolean;
}

/**
 * 删除指定项目的指定分支
 * @param {DeleteBranchOptions} options - 删除分支的配置选项
 * @param {string} options.branchName - 要删除的分支名称
 * @param {string} [options.projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @param {boolean} [options.remote=false] - 是否删除远端分支
 * @param {boolean} [options.force=false] - 是否强制删除分支
 * @returns {Promise<void>}
 */
export async function deleteBranch(options: DeleteBranchOptions & { force?: boolean }): Promise<any> {
    const { branchName, projectPath = process.cwd(), remote = false, force = false } = options;

    const command = remote
        ? `git push origin :refs/heads/${branchName}`
        : force
        ? `git branch -D ${branchName}`
        : `git branch -d ${branchName}`;

    return await execa(command, { cwd: projectPath });
}

/**
 * 获取指定项目的主分支名称
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @returns {Promise<string>} 主分支名称（master 或 main）
 */
export async function getMainBranchName(projectPath: string = process.cwd()): Promise<string> {
    try {
        const branches = await getAllBranches(projectPath);
        const masterBranch = branches.find((b) => b.name === 'master');
        const mainBranch = branches.find((b) => b.name === 'main');

        return masterBranch ? 'master' : mainBranch ? 'main' : '';
    } catch {
        return '';
    }
}

/**
 * 获取分支的第一个提交时间（近似创建时间）
 * @param {string} branchName - 分支名称
 * @param {string} [projectPath=process.cwd()] - 项目路径
 * @returns {Promise<string>} 分支第一个提交的时间
 */
export async function getBranchFirstCommitTime(
    branchName: string,
    projectPath: string = process.cwd(),
): Promise<string> {
    try {
        const { stdout } = await execa(`git log ${branchName} --format=%ci --max-count=1 --reverse`, {
            cwd: projectPath,
        });

        return stdout.trim();
    } catch (error) {
        console.warn(`获取分支 ${branchName} 第一个提交时间失败：${error}`);
        return '';
    }
}
/**
 * 判断当前分支是否在远端有对应的分支。
 * 不需要通过远端获取，在本地获取已拉取的远端分支即可。
 */
export const isCurrenetBranchPushed = async () => {
    const current = await getCurrentBranchName();
    const { stdout } = await execa(`git branch --all`);
    return !!stdout.split('\n').find((item) => item.endsWith(`remotes/origin/${current}`));
};

/**
 * 分割Git日志字符串，将其转换为数组，每个元素为一个提交记录。
 */
export const splitGitLog = async (head: number, cwd: string = process.cwd()) => {
    const log = await execa(`git log -${head}`, { cwd });
    const list = log.stdout.split('\n').filter(Boolean);
    let result: {
        id: string;
        author: string;
        date: string;
        message: string;
    }[] = [];
    for (const line of list) {
        if (line.startsWith('commit')) {
            result.slice(-1)[0]?.message.trimEnd();
            result.push({
                id: line.split(' ')[1],
                author: '',
                date: '',
                message: '',
            });
            continue;
        }
        if (line.startsWith('Author:')) {
            result.slice(-1)[0].author = line.split('Author: ')[1].trim();
            continue;
        }
        if (line.startsWith('Date:')) {
            result.slice(-1)[0].date = dayjs(line.split('Date: ')[1].trim()).format('YYYY-MM-DD HH:mm:ss');
            continue;
        }
        result.slice(-1)[0].message += line.trim() + '\n';
    }
    if (result.length) {
        result = result.map((item) => ({
            ...item,
            message: item.message.trimEnd().replace(/\n$/, ''),
        }));
    }
    return result;
};
