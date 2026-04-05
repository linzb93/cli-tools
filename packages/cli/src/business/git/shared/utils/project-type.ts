import { execaCommand as execa } from 'execa';
import fs from 'fs-extra';
import { resolve } from 'node:path';

/**
 * 检查是否为Github项目
 * @returns {Promise<boolean>} 是否为Github项目
 */
export const isGithubProject = async (): Promise<boolean> => {
    try {
        const { stdout } = await execa('git remote -v');
        return stdout.includes('github.com');
    } catch (error) {
        return false;
    }
};

/**
 * 判断当前项目是否为 Monorepo 项目
 * @param {string} projectPath - 项目根目录路径
 * @returns {Promise<boolean>} 是否为 Monorepo
 */
export const isMonorepo = async (projectPath: string = process.cwd()): Promise<boolean> => {
    const packagesPath = resolve(projectPath, 'packages');
    try {
        const stats = await fs.stat(packagesPath);
        return stats.isDirectory();
    } catch {
        return false;
    }
};
