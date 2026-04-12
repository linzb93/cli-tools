import { execaCommand as execa } from 'execa';

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
