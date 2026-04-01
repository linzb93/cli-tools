import { logger } from '@/utils/logger';
import { executeCommands } from '@/utils/promise';
import fs from 'fs-extra';
import path from 'node:path';
import semver from 'semver';
import chalk from 'chalk';
import { execaCommand } from 'execa';
import inquirer from '@/utils/inquirer';
import type { IterationOptions } from './types';
import gitActions from '../git/shared/utils/actions';
import {
    isGithubProject,
    getGitProjectStatus,
    GitStatusMap,
    getMainBranchName,
    isCurrenetBranchPushed,
} from '../git/shared/utils';
import { isMonorepo } from './utils';

/** 模块级变量 */
let isDebug = false;
let commandsToRun: any[] = [];

/**
 * 创建 Git 命令运行器（不可变，内部判断 debug 模式）
 * @returns {Function} Git 命令执行函数
 */
const createGitCommandRunner = (): Function => {
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

interface CalculateNewVersionParams {
    /** 当前版本号 */
    currentVersion: string;
    /** 传入的目标版本参数 */
    versionArg: string | undefined;
    /** 是否为公司业务项目 */
    isCompanyBusiness: boolean;
    /** 是否为修复模式 */
    fix: boolean;
}

/**
 * 计算新版本号
 * @param {CalculateNewVersionParams} params - 参数对象
 * @returns {string} 计算出的新版本号
 */
const calculateNewVersion = (params: CalculateNewVersionParams): string => {
    const { currentVersion, versionArg, isCompanyBusiness, fix } = params;
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

interface PrepareMainBranchParams {
    /** 项目路径 */
    projectPath: string;
}

/**
 * 检查当前分支并切换到主分支拉取最新代码
 * @param {PrepareMainBranchParams} params - 参数对象
 * @returns {Promise<{ mainBranch: string; currentBranch: string }>} 返回主分支名和当前分支名
 */
const prepareMainBranch = async (
    params: PrepareMainBranchParams,
): Promise<{ mainBranch: string; currentBranch: string }> => {
    const { projectPath } = params;
    const runGitCommands = createGitCommandRunner();
    const gitStatus = await getGitProjectStatus(projectPath);
    const mainBranch = (await getMainBranchName(projectPath)) || 'master';
    const currentBranch = gitStatus.branchName;

    if (currentBranch !== mainBranch) {
        if (gitStatus.status === GitStatusMap.Uncommitted) {
            logger.info('当前分支有未提交的代码，正在自动提交...');
            await runGitCommands(['git add .', gitActions.commit('chore: save uncommitted changes before iteration')]);
        }
        logger.info(`切换到主干分支 ${mainBranch} 并拉取最新代码...`);
        await runGitCommands([`git checkout ${mainBranch}`, 'git pull']);
    } else {
        logger.info('拉取最新主干代码...');
        await runGitCommands(['git pull']);
    }

    return { mainBranch, currentBranch };
};

interface HandleTargetBranchParams {
    /** 是否为修复模式 */
    fix: boolean;
    /** 是否为公司业务项目 */
    isCompanyBusiness: boolean;
    /** 主分支名 */
    mainBranch: string;
    /** 新版本号 */
    newVersion: string;
}

/**
 * 处理目标开发分支（创建或切换）
 * @param {HandleTargetBranchParams} params - 参数对象
 * @returns {Promise<{ targetBranch: string; finalVersion: string }>} 最终使用的分支和版本号
 */
const handleTargetBranch = async (
    params: HandleTargetBranchParams,
): Promise<{ targetBranch: string; finalVersion: string }> => {
    const { fix, isCompanyBusiness, mainBranch, newVersion } = params;
    const runGitCommands = createGitCommandRunner();
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

interface UpdatePackageVersionsParams {
    /** 项目路径 */
    projectPath: string;
    /** 根目录 package.json 路径 */
    pkgPath: string;
    /** 新版本号 */
    newVersion: string;
    /** 是否为 Monorepo 项目 */
    isMono: boolean;
}

/**
 * 更新项目的 package.json 中的版本号
 * @param {UpdatePackageVersionsParams} params - 参数对象
 * @returns {Promise<void>}
 */
const updatePackageVersions = async (params: UpdatePackageVersionsParams): Promise<void> => {
    const { projectPath, pkgPath, newVersion, isMono } = params;
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

interface CommitAndPushChangesParams {
    /** 新版本号 */
    newVersion: string;
    /** 目标分支名 */
    targetBranch: string;
    /** 是否为 GitHub 项目 */
    isGithub: boolean;
}

/**
 * 提交并推送代码到远端
 * @param {CommitAndPushChangesParams} params - 参数对象
 * @returns {Promise<void>}
 */
const commitAndPushChanges = async (params: CommitAndPushChangesParams): Promise<void> => {
    const { newVersion, targetBranch, isGithub } = params;
    const runGitCommands = createGitCommandRunner();
    logger.info('提交版本变更并推送到远端...');
    await runGitCommands(['git add .', gitActions.commit(`chore: bump version to ${newVersion}`)]);

    if (isDebug) {
        await runGitCommands([gitActions.push(true, targetBranch)]);
        logger.info('预计将执行上述 Git 命令。');
        return;
    }

    if (!isGithub) {
        if (await isCurrenetBranchPushed()) {
            await runGitCommands([gitActions.push()]);
            logger.success(`成功推送到远程`);
        } else {
            await runGitCommands([gitActions.push(true, targetBranch)]);
            logger.success(`成功推送到远程并设置上游分支`);
        }
    } else {
        if (await isCurrenetBranchPushed()) {
            await runGitCommands([gitActions.push()]);
        } else {
            await runGitCommands([gitActions.push(true, targetBranch)]);
        }
    }
};

interface PrintDryRunResultParams {
    /** 当前分支名 */
    currentBranch: string;
    /** 目标分支名 */
    targetBranch: string;
    /** 原版本号 */
    currentVersion: string;
    /** 新版本号 */
    newVersion: string;
}

/**
 * 打印 Dry Run 结果
 * @param {PrintDryRunResultParams} params - 参数对象
 * @returns {void}
 */
const printDryRunResult = (params: PrintDryRunResultParams): void => {
    const { currentBranch, targetBranch, currentVersion, newVersion } = params;
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

    // 初始化模块级变量
    isDebug = process.argv.includes('--debug') || !!process.env.DEBUG;
    commandsToRun = [];

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

        const pkg = await fs.readJSON(pkgPath);
        const currentVersion = pkg.version;

        const newVersion = calculateNewVersion({ currentVersion, versionArg, isCompanyBusiness, fix });

        logger.info(`项目类型: ${isGithub ? 'GitHub' : '公司'}${isMono ? ' Monorepo' : ' 普通项目'}`);
        logger.info(`当前版本: ${chalk.green(currentVersion)}`);
        logger.info(`新版本: ${chalk.green(newVersion)}`);

        // 1. 前置检查与主干切换
        const { mainBranch, currentBranch } = await prepareMainBranch({ projectPath });

        // 2. 开发分支策略
        const { targetBranch, finalVersion } = await handleTargetBranch({
            fix,
            isCompanyBusiness,
            mainBranch,
            newVersion,
        });

        // 3. 更新版本号
        await updatePackageVersions({ projectPath, pkgPath, newVersion: finalVersion, isMono });

        // 4. 提交并推送
        await commitAndPushChanges({ newVersion: finalVersion, targetBranch, isGithub });

        // 5. Debug 输出
        if (isDebug) {
            printDryRunResult({ currentBranch, targetBranch, currentVersion, newVersion: finalVersion });
            return;
        }

        logger.success(`操作完成！当前处于 ${targetBranch} 分支，版本号已更新为 ${finalVersion}`);
    } catch (error: any) {
        logger.error(`操作失败: ${error.message || error}`);
    }
};
