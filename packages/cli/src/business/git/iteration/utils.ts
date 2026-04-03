import fs from 'fs-extra';
import path from 'node:path';

/**
 * 判断当前项目是否为 Monorepo 项目
 * @param {string} projectPath - 项目根目录路径
 * @returns {Promise<boolean>} 是否为 Monorepo
 */
export const isMonorepo = async (projectPath: string = process.cwd()): Promise<boolean> => {
    const packagesPath = path.resolve(projectPath, 'packages');
    try {
        const stats = await fs.stat(packagesPath);
        return stats.isDirectory();
    } catch {
        return false;
    }
};
