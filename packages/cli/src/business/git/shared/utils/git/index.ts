import { execaCommand } from 'execa';
import { getCurrentBranchName } from './branch';

/**
 * 判断指定路径是否是 Git 项目
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @returns {Promise<boolean>} 是否为 Git 项目
 */
export async function isGitProject(projectPath: string = process.cwd()): Promise<boolean> {
    try {
        await execaCommand(`git rev-parse --is-inside-work-tree`, { cwd: projectPath });
        return true;
    } catch {
        return false;
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
        const { stdout } = await execaCommand('git status', {
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
