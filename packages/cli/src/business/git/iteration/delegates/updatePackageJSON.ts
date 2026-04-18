import { logger } from '@/utils/logger';
import fs from 'fs-extra';
import path from 'node:path';
/**
 * 更新 package.json 文件的版本号
 * @param pkgPath package.json 文件路径
 * @param version 新的版本号
 */
export async function updatePackageJSON(projectPath: string, pkgPath: string, version: string) {
    const isDebug = process.env.MODE === 'cliTest';
    if (isDebug) {
        logger.info(`更新版本号为 ${version}`);
        return;
    }
    if (await fs.pathExists(pkgPath)) {
        const packageData = await fs.readJSON(pkgPath);
        packageData.version = version;
        await fs.writeJSON(pkgPath, packageData, { spaces: 4 });
    }
}
/**
 * 更新 monorepo 项目的 package.json 文件的版本号
 * @param projectPath package.json 文件路径
 * @param version 新的版本号
 */
export async function updateMonorepoPackageJSON(projectPath: string, pkgPath: string, version: string) {
    const packagesDir = path.resolve(projectPath, 'packages');
    if (await fs.pathExists(packagesDir)) {
        const dirs = await fs.readdir(packagesDir);
        for (const dir of dirs) {
            const subPkgPath = path.resolve(packagesDir, dir, 'package.json');
            const stat = await fs.stat(path.resolve(packagesDir, dir));
            if (stat.isDirectory()) {
                await updatePackageJSON(projectPath, subPkgPath, version);
            }
        }
    }
}
