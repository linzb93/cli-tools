import fs from 'fs-extra';
import { resolve } from 'node:path';
import { globby } from 'globby';
import chalk from 'chalk';
import { execaCommand } from 'execa';
import pMap from 'p-map';

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

/**
 * 检查项目是否有硬编码文件
 * @param {string} projectPath - 项目根目录路径
 * @returns {Promise<boolean>} 是否有硬编码
 */
export const checkHardcoded = async (projectPath: string = process.cwd()): Promise<boolean> => {
    const businessPaths = await findBusinessPaths(projectPath);
    let hasHardcoded = false;

    await pMap(
        businessPaths,
        async (path) => {
            try {
                const { stdout } = await execaCommand(`grep -rn "// test" --include=${path}`, {
                    cwd: projectPath,
                });
                if (stdout.trim()) {
                    console.log(chalk.red(`发现硬编码文件: ${stdout}`));
                    hasHardcoded = true;
                }
            } catch {
                // 没有找到硬编码文件是正常的
            }
        },
        { concurrency: 4 },
    );

    return hasHardcoded;
};
