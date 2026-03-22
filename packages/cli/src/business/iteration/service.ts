import { logger } from '@/utils/logger';
import { executeCommands } from '@/utils/promise';
import fs from 'fs-extra';
import path from 'node:path';
import semver from 'semver';
import chalk from 'chalk';
import { execaCommand } from 'execa';
import inquirer from '@/utils/inquirer';
import type { IterationOptions } from './types';
import gitAtom from '../git/shared/utils/atom';
import {
    isGithubProject,
    getGitProjectStatus,
    GitStatusMap,
    getCurrentBranchName,
    getMainBranchName,
    isCurrenetBranchPushed,
} from '../git/shared/utils';
import { isMonorepo } from './utils';

/**
 * iteration 命令的业务实现
 * @param {IterationOptions} options - 命令选项
 * @returns {Promise<void>}
 */
export const iterationService = async (options: IterationOptions): Promise<void> => {
    const { fix, version: versionArg } = options;
    const projectPath = process.cwd();
    const pkgPath = path.resolve(projectPath, 'package.json');

    if (!fs.existsSync(pkgPath)) {
        logger.error('未找到 package.json 文件');
        return;
    }

    try {
        const isGithub = await isGithubProject();
        const isMono = await isMonorepo(projectPath);
        const isCompanyBusiness = !isGithub && !isMono;

        const pkg = await fs.readJson(pkgPath);
        const currentVersion = pkg.version;
        let newVersion = versionArg;

        if (!newVersion) {
            if (!semver.valid(currentVersion)) {
                logger.error(`当前版本号无效: ${currentVersion}`);
                return;
            }

            // GitHub 或 Monorepo: 默认 minor, fix 时 patch
            // 公司业务项目: 永远 patch
            let releaseType: semver.ReleaseType = 'minor';
            if (isCompanyBusiness || fix) {
                releaseType = 'patch';
            }

            newVersion = semver.inc(currentVersion, releaseType) as string;
        }

        if (!semver.valid(newVersion)) {
            logger.error(`新版本号无效: ${newVersion}`);
            return;
        }

        logger.info(`项目类型: ${isGithub ? 'GitHub' : '公司'}${isMono ? ' Monorepo' : ' 普通项目'}`);
        logger.info(`当前版本: ${chalk.green(currentVersion)}`);
        logger.info(`新版本: ${chalk.green(newVersion)}`);

        // 1. 前置检查与主干切换
        const gitStatus = await getGitProjectStatus(projectPath);
        const mainBranch = await getMainBranchName(projectPath) || 'master';
        const currentBranch = gitStatus.branchName;

        if (currentBranch !== mainBranch) {
            if (gitStatus.status === GitStatusMap.Uncommitted) {
                logger.info('当前分支有未提交的代码，正在自动提交...');
                await executeCommands(['git add .', gitAtom.commit('chore: save uncommitted changes before iteration')]);
            }
            logger.info(`切换到主干分支 ${mainBranch} 并拉取最新代码...`);
            await executeCommands([
                `git checkout ${mainBranch}`,
                'git pull'
            ]);
        } else {
            // 在主干分支也拉一下最新代码
            logger.info('拉取最新主干代码...');
            await executeCommands(['git pull']);
        }

        // 2. 开发分支策略
        let targetBranch = '';
        if (fix) {
            targetBranch = mainBranch;
            logger.info(`修复模式: 保持在 ${mainBranch} 分支进行更新`);
        } else {
            if (isCompanyBusiness) {
                targetBranch = `dev-${newVersion}`;
                // 检查分支是否存在
                let isBranchExist = false;
                try {
                    await execaCommand(`git show-ref --verify --quiet refs/heads/${targetBranch}`);
                    isBranchExist = true;
                } catch (e) {
                    isBranchExist = false;
                }

                if (isBranchExist) {
                    const answer = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'version',
                            message: `分支 ${targetBranch} 已存在，请输入新的版本号:`,
                            validate: async (input: string) => {
                                if (!input) return '版本号不能为空';
                                if (!semver.valid(input)) return '版本号无效';
                                try {
                                    await execaCommand(`git show-ref --verify --quiet refs/heads/dev-${input}`);
                                    return `分支 dev-${input} 依然存在，请重新输入`;
                                } catch (e) {
                                    return true;
                                }
                            },
                        },
                    ]);
                    newVersion = answer.version;
                    targetBranch = `dev-${newVersion}`;
                }

                logger.info(`基于主干创建并切换到 ${targetBranch} 分支...`);
                await executeCommands([`git checkout -b ${targetBranch}`]);
            } else {
                targetBranch = 'dev';
                logger.info(`切换到 ${targetBranch} 分支...`);
                try {
                    await executeCommands([`git checkout ${targetBranch}`]);
                } catch (e) {
                    logger.info(`本地不存在 ${targetBranch} 分支，正在新建...`);
                    await executeCommands([`git checkout -b ${targetBranch}`]);
                }
            }
        }

        // 3. 更新版本号
        logger.info('正在更新 package.json 版本号...');
        const updatePackageJson = async (pPath: string, version: string) => {
            if (await fs.pathExists(pPath)) {
                const packageData = await fs.readJson(pPath);
                packageData.version = version;
                await fs.writeJson(pPath, packageData, { spaces: 4 });
            }
        };

        // 更新根目录
        await updatePackageJson(pkgPath, newVersion);

        // 如果是 monorepo，更新 packages 下的所有子包
        if (isMono) {
            const packagesDir = path.resolve(projectPath, 'packages');
            if (await fs.pathExists(packagesDir)) {
                const dirs = await fs.readdir(packagesDir);
                for (const dir of dirs) {
                    const subPkgPath = path.resolve(packagesDir, dir, 'package.json');
                    const stat = await fs.stat(path.resolve(packagesDir, dir));
                    if (stat.isDirectory()) {
                        await updatePackageJson(subPkgPath, newVersion);
                    }
                }
            }
        }

        // 4. 提交并推送
        logger.info('提交版本变更并推送到远端...');
        await executeCommands([
            'git add .',
            gitAtom.commit(`chore: bump version to ${newVersion}`)
        ]);

        if (!isGithub) {
            // 公司项目推送逻辑
            if (await isCurrenetBranchPushed()) {
                await executeCommands([gitAtom.push()]);
                logger.success(`成功推送到远程`);
            } else {
                await executeCommands([gitAtom.push(true, targetBranch)]);
                logger.success(`成功推送到远程并设置上游分支`);
            }
        } else {
            // Github项目也可以推送
            if (await isCurrenetBranchPushed()) {
                await executeCommands([gitAtom.push()]);
            } else {
                await executeCommands([gitAtom.push(true, targetBranch)]);
            }
        }

        logger.success(`操作完成！当前处于 ${targetBranch} 分支，版本号已更新为 ${newVersion}`);
    } catch (error: any) {
        logger.error(`操作失败: ${error.message || error}`);
    }
};
