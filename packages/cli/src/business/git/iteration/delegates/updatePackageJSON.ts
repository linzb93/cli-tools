import { logger } from '@/utils/logger';
import fs from 'fs-extra';
import path from 'node:path';
import { getContext } from '../shared';
/**
 * 更新 package.json 文件的版本号
 * @param pPath package.json 文件路径
 * @param version 新的版本号
 */
export async function updatePackageJSON(pPath: string, version: string) {
    const isDebug = process.env.MODE === 'cliTest';
    if (isDebug) {
        logger.info(`更新版本号为 ${version}`);
        return;
    }
    if (await fs.pathExists(pPath)) {
        const packageData = await fs.readJSON(pPath);
        packageData.version = version;
        await fs.writeJSON(pPath, packageData, { spaces: 4 });
    }
}
/**
 * 更新 monorepo 项目的 package.json 文件的版本号
 * @param pPath package.json 文件路径
 * @param version 新的版本号
 */
export async function updateMonorepoPackageJSON(pPath: string, version: string) {
    const ctx = getContext();
    const projectPath = ctx.projectPath;
    const packagesDir = path.resolve(projectPath, 'packages');
    if (await fs.pathExists(packagesDir)) {
        const dirs = await fs.readdir(packagesDir);
        for (const dir of dirs) {
            const subPkgPath = path.resolve(packagesDir, dir, 'package.json');
            const stat = await fs.stat(path.resolve(packagesDir, dir));
            if (stat.isDirectory()) {
                await updatePackageJSON(subPkgPath, version);
            }
        }
    }
}
