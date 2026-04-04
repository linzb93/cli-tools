import fs from 'fs-extra';
import { resolve } from 'node:path';
import { globby } from 'globby';

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

export const findBusinessPaths = async (projectPath: string = process.cwd()): Promise<string[]> => {
    const buildConfigFiles = await globby(['vue.config.js', 'vite.config.js', 'vite.config.ts']);
    if (await isMonorepo(projectPath)) {
        const dirs = await fs.readdir(resolve(projectPath, 'packages'));
        return buildConfigFiles.concat(dirs.map((dir) => resolve(projectPath, 'packages', dir, 'src/')));
    }
    return buildConfigFiles.concat('src/');
};
