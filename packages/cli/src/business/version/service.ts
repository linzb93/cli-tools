import { logger } from '@/utils/logger';
import { executeCommands } from '@/utils/promise';
import fs from 'fs-extra';
import path from 'node:path';
import semver from 'semver';
import chalk from 'chalk';
import type { VersionOptions } from './types';

/**
 * version 命令的业务实现
 * @param {VersionOptions} options - 版本命令选项
 * @returns {Promise<void>}
 */
export const versionService = async (options: VersionOptions): Promise<void> => {
    const { versionArg } = options;
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    if (!fs.existsSync(pkgPath)) {
        logger.error('未找到 package.json 文件');
        return;
    }

    try {
        const pkg = await fs.readJson(pkgPath);
        const currentVersion = pkg.version;
        let newVersion = versionArg;

        // 如果没有提供版本号参数，则自动增加 patch 版本
        if (!newVersion) {
            if (!semver.valid(currentVersion)) {
                logger.error(`当前版本号无效: ${currentVersion}`);
                return;
            }
            newVersion = semver.inc(currentVersion, 'patch') as string;
        }

        // 验证新版本号
        if (!semver.valid(newVersion)) {
            logger.error(`新版本号无效: ${newVersion}`);
            return;
        }

        logger.info(`当前版本: ${chalk.green(currentVersion)}`);
        logger.info(`新版本: ${chalk.green(newVersion)}`);

        // 执行 Git 操作
        // 1. 切换到 master 分支
        // 2. 拉取最新代码
        // 3. 创建新分支 dev-{newVersion}
        logger.info('正在执行 Git 操作...');
        await executeCommands(['git checkout master', 'git pull', `git checkout -b dev-${newVersion}`]);

        // 修改 package.json
        pkg.version = newVersion;
        await fs.writeJson(pkgPath, pkg, { spaces: 4 });

        logger.success(`成功创建分支 dev-${newVersion} 并更新 package.json 版本为 ${newVersion}`);
    } catch (error: any) {
        logger.error(`操作失败: ${error.message || error}`);
    }
};