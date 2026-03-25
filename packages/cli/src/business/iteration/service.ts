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
    getMainBranchName,
    isCurrenetBranchPushed,
} from '../git/shared/utils';
import { isMonorepo } from './utils';

/**
 * 创建 Git 命令运行器
 * @param {boolean} isDebug - 是否处于 Debug 模式
 * @param {any[]} commandsToRun - 用于记录执行的命令的数组
 * @returns {Function} Git 命令执行函数
 */
const createGitCommandRunner = (isDebug: boolean, commandsToRun: any[]): Function => {
    return async (cmds: any[], ignoreError = false) => {
        if (isDebug) {
            commandsToRun.push(...cmds);
        } else {
            try {
                await executeCommands(cmds);
            } catch (e) {
                if (!ignoreError) throw e;
            }
        }
    };
};

/**
 * 计算新版本号
 * @param {string} currentVersion - 当前版本
 * @param {string | undefined} versionArg - 传入的目标版本参数
 * @param {boolean} isCompanyBusiness - 是否为公司业务项目
 * @param {boolean} fix - 是否为修复模式
 * @returns {string} 计算出的新版本号
 */
const calculateNewVersion = (
    currentVersion: string,
    versionArg: string | undefined,
    isCompanyBusiness: boolean,
    fix: boolean,
): string => {
    if (versionArg) return versionArg;

    if (!semver.valid(currentVersion)) {
        throw new Error(`当前版本号无效: ${currentVersion}`);
    }

    let releaseType: semver.ReleaseType = 'minor';
    if (isCompanyBusiness || fix) {
        releaseType = 'patch';
    }

    const newVersion = semver.inc(currentVersion, releaseType);
    if (!newVersion || !semver.valid(newVersion)) {
        throw new Error(`新版本号无效: ${newVersion}`);
    }

    return newVersion;
};

/**
 * 检查当前分支并切换到主分支拉取最新代码
 * @param {string} projectPath - 项目路径
 * @param {Function} runGitCommands - Git 执行器
 * @returns {Promise<{ mainBranch: string; currentBranch: string }>} 返回主分支名和当前分支名
 */
const prepareMainBranch = async (
    projectPath: string,
    runGitCommands: Function,
): Promise<{ mainBranch: string; currentBranch: string }> => {
    const gitStatus = await getGitProjectStatus(projectPath);
    const mainBranch = (await getMainBranchName(projectPath)) || 'master';
    const currentBranch = gitStatus.branchName;

    if (currentBranch !== mainBranch) {
        if (gitStatus.status === GitStatusMap.Uncommitted) {
            logger.info('当前分支有未提交的代码，正在自动提交...');
            await runGitCommands(['git add .', gitAtom.commit('chore: save uncommitted changes before iteration')]);
        }
        logger.info(`切换到主干分支 ${mainBranch} 并拉取最新代码...`);
        await runGitCommands([`git checkout ${mainBranch}`, 'git pull']);
    } else {
        logger.info('拉取最新主干代码...');
        await runGitCommands(['git pull']);
    }

    return { mainBranch, currentBranch };
};

/**
 * 处理目标开发分支（创建或切换）
 * @param {boolean} fix - 是否为修复模式
 * @param {boolean} isCompanyBusiness - 是否为公司业务项目
 * @param {string} mainBranch - 主分支名
 * @param {string} newVersion - 新版本号
 * @param {Function} runGitCommands - Git 执行器
 * @param {boolean} isDebug - 是否为 Debug 模式
 * @returns {Promise<{ targetBranch: string; finalVersion: string }>} 最终使用的分支和版本号
 */
const handleTargetBranch = async (
    fix: boolean,
    isCompanyBusiness: boolean,
    mainBranch: string,
    newVersion: string,
    runGitCommands: Function,
    isDebug: boolean,
): Promise<{ targetBranch: string; finalVersion: string }> => {
    let targetBranch = '';
    let finalVersion = newVersion;

    if (fix) {
        targetBranch = mainBranch;
        logger.info(`修复模式: 保持在 ${mainBranch} 分支进行更新`);
        return { targetBranch, finalVersion };
    }

    if (isCompanyBusiness) {
        targetBranch = `dev-${finalVersion}`;
        let isBranchExist = false;
        try {
            await execaCommand(`git show-ref --verify --quiet refs/heads/${targetBranch}`);
            isBranchExist = true;
        } catch {
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
                        } catch {
                            return true;
                        }
                    },
                },
            ]);
            finalVersion = answer.version;
            targetBranch = `dev-${finalVersion}`;
        }

        logger.info(`基于主干创建并切换到 ${targetBranch} 分支...`);
        await runGitCommands([`git checkout -b ${targetBranch}`]);
    } else {
        targetBranch = 'dev';
        logger.info(`切换到 ${targetBranch} 分支...`);
        if (isDebug) {
            await runGitCommands([`git checkout ${targetBranch}`]);
        } else {
            try {
                await runGitCommands([`git checkout ${targetBranch}`]);
            } catch {
                logger.info(`本地不存在 ${targetBranch} 分支，正在新建...`);
                await runGitCommands([`git checkout -b ${targetBranch}`]);
            }
        }
    }

    return { targetBranch, finalVersion };
};

/**
 * 更新项目的 package.json 中的版本号
 * @param {string} projectPath - 项目路径
 * @param {string} pkgPath - 根目录 package.json 路径
 * @param {string} newVersion - 新版本号
 * @param {boolean} isMono - 是否为 Monorepo 项目
 * @param {boolean} isDebug - 是否为 Debug 模式
 * @returns {Promise<void>}
 */
const updatePackageVersions = async (
    projectPath: string,
    pkgPath: string,
    newVersion: string,
    isMono: boolean,
    isDebug: boolean,
): Promise<void> => {
    logger.info('正在更新 package.json 版本号...');
    const updatePackageJson = async (pPath: string, version: string) => {
        if (isDebug) {
            logger.info(`[Dry Run] 更新 ${pPath} 版本号为 ${version}`);
            return;
        }
        if (await fs.pathExists(pPath)) {
            const packageData = await fs.readJson(pPath);
            packageData.version = version;
            await fs.writeJson(pPath, packageData, { spaces: 4 });
        }
    };

    await updatePackageJson(pkgPath, newVersion);

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
};

/**
 * 提交并推送代码到远端
 * @param {string} newVersion - 新版本号
 * @param {string} targetBranch - 目标分支名
 * @param {boolean} isGithub - 是否为 GitHub 项目
 * @param {Function} runGitCommands - Git 执行器
 * @param {boolean} isDebug - 是否为 Debug 模式
 * @returns {Promise<void>}
 */
const commitAndPushChanges = async (
    newVersion: string,
    targetBranch: string,
    isGithub: boolean,
    runGitCommands: Function,
    isDebug: boolean,
): Promise<void> => {
    logger.info('提交版本变更并推送到远端...');
    await runGitCommands(['git add .', gitAtom.commit(`chore: bump version to ${newVersion}`)]);

    if (isDebug) {
        await runGitCommands([gitAtom.push(true, targetBranch)]);
        logger.info('预计将执行上述 Git 命令。');
        return;
    }

    if (!isGithub) {
        if (await isCurrenetBranchPushed()) {
            await runGitCommands([gitAtom.push()]);
            logger.success(`成功推送到远程`);
        } else {
            await runGitCommands([gitAtom.push(true, targetBranch)]);
            logger.success(`成功推送到远程并设置上游分支`);
        }
    } else {
        if (await isCurrenetBranchPushed()) {
            await runGitCommands([gitAtom.push()]);
        } else {
            await runGitCommands([gitAtom.push(true, targetBranch)]);
        }
    }
};

/**
 * 打印 Dry Run 结果
 * @param {string} currentBranch - 当前分支名
 * @param {string} targetBranch - 目标分支名
 * @param {string} currentVersion - 原版本号
 * @param {string} newVersion - 新版本号
 * @param {any[]} commandsToRun - 计划执行的命令数组
 * @returns {void}
 */
const printDryRunResult = (
    currentBranch: string,
    targetBranch: string,
    currentVersion: string,
    newVersion: string,
    commandsToRun: any[],
): void => {
    logger.info(chalk.cyan('\n=== Dry Run 执行结果 ==='));
    logger.info(`当前分支: ${currentBranch}`);
    logger.info(`目标分支: ${targetBranch}`);
    logger.info(`项目原版本: ${currentVersion}`);
    logger.info(`项目新版本: ${newVersion}`);
    logger.info(`计划执行的 Git 命令:`);
    commandsToRun.forEach((cmd, idx) => {
        const cmdStr = typeof cmd === 'string' ? cmd : cmd.message;
        logger.info(`  ${idx + 1}. ${cmdStr}`);
    });
    logger.info(chalk.cyan('========================\n'));
};

/**
 * iteration 命令的主编排流程
 * @param {IterationOptions} options - 命令选项
 * @returns {Promise<void>}
 */
export const iterationService = async (options: IterationOptions): Promise<void> => {
    const { fix = false, version: versionArg } = options;
    const projectPath = process.cwd();
    const pkgPath = path.resolve(projectPath, 'package.json');
    const isDebug = process.argv.includes('--debug') || !!process.env.DEBUG;

    const commandsToRun: (string | any)[] = [];
    const runGitCommands = createGitCommandRunner(isDebug, commandsToRun);

    if (isDebug) {
        logger.info(chalk.bgBlue.white(' === DEBUG 模式 (Dry Run) === '));
    }

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

        const newVersion = calculateNewVersion(currentVersion, versionArg, isCompanyBusiness, fix);

        logger.info(`项目类型: ${isGithub ? 'GitHub' : '公司'}${isMono ? ' Monorepo' : ' 普通项目'}`);
        logger.info(`当前版本: ${chalk.green(currentVersion)}`);
        logger.info(`新版本: ${chalk.green(newVersion)}`);

        // 1. 前置检查与主干切换
        const { mainBranch, currentBranch } = await prepareMainBranch(projectPath, runGitCommands);

        // 2. 开发分支策略
        const { targetBranch, finalVersion } = await handleTargetBranch(
            fix,
            isCompanyBusiness,
            mainBranch,
            newVersion,
            runGitCommands,
            isDebug,
        );

        // 3. 更新版本号
        await updatePackageVersions(projectPath, pkgPath, finalVersion, isMono, isDebug);

        // 4. 提交并推送
        await commitAndPushChanges(finalVersion, targetBranch, isGithub, runGitCommands, isDebug);

        // 5. Debug 输出
        if (isDebug) {
            printDryRunResult(currentBranch, targetBranch, currentVersion, finalVersion, commandsToRun);
            return;
        }

        logger.success(`操作完成！当前处于 ${targetBranch} 分支，版本号已更新为 ${finalVersion}`);
    } catch (error: any) {
        logger.error(`操作失败: ${error.message || error}`);
    }
};
