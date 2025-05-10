import { execa } from 'execa';

/**
 * 判断指定路径是否是 Git 项目
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @returns {Promise<boolean>} 是否为 Git 项目
 */
export async function isGitProject(projectPath: string = process.cwd()): Promise<boolean> {
    try {
        await execa('git', ['rev-parse', '--is-inside-work-tree'], { cwd: projectPath });
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
        const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: projectPath });
        return stdout.trim();
    } catch {
        return '';
    }
}

/**
 * 获取指定 Git 项目的状态
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @returns {Promise<number>} 状态码
 * - 0: 状态未知
 * - 1: 未提交
 * - 2: 未推送
 * - 3: 已推送
 * - 4: 不在 master/main 分支上
 */
export async function getGitProjectStatus(projectPath: string = process.cwd()): Promise<number> {
    try {
        const branchName = await getCurrentBranchName(projectPath);

        // 检查是否在 master/main 分支
        if (!['master', 'main'].includes(branchName)) {
            return 4;
        }

        // 检查是否有未提交的更改
        const { stdout: statusOutput } = await execa('git', ['status', '--porcelain'], { cwd: projectPath });
        if (statusOutput.trim().length > 0) {
            return 1;
        }

        // 检查是否有未推送的提交
        const { stdout: unpushedCommits } = await execa('git', ['cherry', '-v'], { cwd: projectPath });
        if (unpushedCommits.trim().length > 0) {
            return 2;
        }

        return 3;
    } catch {
        return 0;
    }
}

/**
 * 获取指定 Git 项目的远端地址
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @returns {Promise<string>} 远端地址
 */
export async function getRemoteUrl(projectPath: string = process.cwd()): Promise<string> {
    try {
        const { stdout } = await execa('git', ['config', '--get', 'remote.origin.url'], { cwd: projectPath });
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
        const { stdout } = await execa('git', ['tag'], { cwd: projectPath });
        return stdout.trim().split('\n').filter(Boolean);
    } catch {
        return [];
    }
}

/**
 * 删除指定项目的部分 tag
 * @param {string[]} tags - 要删除的 tag 列表
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @returns {Promise<void>}
 */
export async function deleteTags(tags: string[], projectPath: string = process.cwd()): Promise<void> {
    for (const tag of tags) {
        try {
            await execa('git', ['tag', '-d', tag], { cwd: projectPath });
        } catch (error) {
            console.warn(`删除 tag ${tag} 失败：${error}`);
        }
    }
}

/**
 * 获取指定项目的所有分支及其创建相关信息
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @returns {Promise<Array<{
 *   name: string,
 *   firstCommitTime: string,
 *   latestCommitHash: string,
 *   remoteTracking?: string
 * }>>} 分支信息列表
 */
export async function getAllBranchesDetailed(projectPath: string = process.cwd()): Promise<
    Array<{
        name: string;
        firstCommitTime: string;
        latestCommitHash: string;
        remoteTracking?: string;
    }>
> {
    try {
        const { stdout } = await execa('git', ['branch', '-vv'], { cwd: projectPath });

        const branchPromises = stdout
            .trim()
            .split('\n')
            .map(async (line) => {
                // 使用正则提取分支信息
                const match = line.match(/^\*?\s+(\S+)\s+(\S+)\s*(\[.*\])?\s*(.*)$/);

                if (!match) return null;

                const branchName = match[1];
                const latestCommitHash = match[2];
                const remoteTracking = match[3] || '';

                // 获取分支第一个提交时间
                const firstCommitTime = await getBranchFirstCommitTime(branchName, projectPath);

                return {
                    name: branchName,
                    firstCommitTime,
                    latestCommitHash,
                    remoteTracking: remoteTracking.replace(/[\[\]]/g, ''),
                };
            });

        const branches = await Promise.all(branchPromises);
        return branches.filter(Boolean) as Array<{
            name: string;
            firstCommitTime: string;
            latestCommitHash: string;
            remoteTracking?: string;
        }>;
    } catch {
        return [];
    }
}

/**
 * 删除指定项目的指定分支
 * @param {string} branchName - 要删除的分支名称
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @param {boolean} [force=false] - 是否强制删除
 * @returns {Promise<void>}
 */
export async function deleteBranch(
    branchName: string,
    projectPath: string = process.cwd(),
    force: boolean = false
): Promise<void> {
    try {
        const args = force ? ['-D', branchName] : ['-d', branchName];
        await execa('git', ['branch', ...args], { cwd: projectPath });
    } catch (error) {
        console.warn(`删除分支 ${branchName} 失败：${error}`);
    }
}

/**
 * 获取指定项目的主分支名称
 * @param {string} [projectPath=process.cwd()] - 项目路径，默认为当前工作目录
 * @returns {Promise<string>} 主分支名称（master 或 main）
 */
export async function getMainBranchName(projectPath: string = process.cwd()): Promise<string> {
    try {
        const branches = await getAllBranchesDetailed(projectPath);
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
    projectPath: string = process.cwd()
): Promise<string> {
    try {
        const { stdout } = await execa('git', ['log', branchName, '--format=%ci', '--max-count=1', '--reverse'], {
            cwd: projectPath,
        });

        return stdout.trim();
    } catch (error) {
        console.warn(`获取分支 ${branchName} 第一个提交时间失败：${error}`);
        return '';
    }
}
