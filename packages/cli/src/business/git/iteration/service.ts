import { logger } from '@/utils/logger';
import { executeCommands, type Command } from '@/utils/execuate-command-line';
import fs from 'fs-extra';
import path from 'node:path';
import semver from 'semver';
import { readPackageSync } from 'read-pkg';
import chalk from 'chalk';
import gitActions from '../shared/utils/actions';
import { getGitProjectStatus, GitStatusMap, getMainBranchName, checkBranchExist } from '../shared/utils';
import { createIterationStrategy } from './core/Factory';
import { isGithubProject, isMonorepo } from '../shared/utils/project-type';
import type { IterationContext, IterationOptions } from './types';

/** 模块级变量 */
let isDebug = process.env.MODE === 'cliTest';
let context: IterationContext = {
    projectPath: process.cwd(),
    pkgPath: path.resolve(process.cwd(), 'package.json'),
    currentVersion: '',
    newVersion: '',
    finalVersion: '',
    mainBranch: '',
    currentBranch: '',
    targetBranch: '',
    isMono: false,
    isGithub: false,
    fix: false,
    shouldCreateBranch: false,
};

/**
 * 创建 Git 命令运行器（不可变，内部判断 debug 模式）
 * @returns Git 命令执行函数
 */
const createGitCommandRunner = (): Function => {
    return async (cmds: Command[], ignoreError = false) => {
        try {
            await executeCommands(cmds);
        } catch (e) {
            if (!ignoreError) throw e;
        }
    };
};

/**
 * 计算新版本号
 * @param currentVersion 当前版本号
 * @param versionArg 传入的目标版本参数
 * @param releaseType 版本递增类型
 * @returns 计算出的新版本号
 */
const calculateNewVersion = (
    currentVersion: string,
    versionArg: string | undefined,
    releaseType: semver.ReleaseType,
): string => {
    if (versionArg) return versionArg;

    // 如果没有当前版本，从 1.0.0 开始
    if (!currentVersion) {
        return '1.0.0';
    }

    if (!semver.valid(currentVersion)) {
        throw new Error(`当前版本号无效: ${currentVersion}`);
    }

    const newVersion = semver.inc(currentVersion, releaseType);
    if (!newVersion || !semver.valid(newVersion)) {
        throw new Error(`新版本号无效: ${newVersion}`);
    }

    return newVersion;
};

/**
 * 检查当前分支并切换到主分支拉取最新代码
 * @returns Promise<{ mainBranch: string; currentBranch: string }>
 */
const prepareMainBranch = async (): Promise<{ mainBranch: string; currentBranch: string }> => {
    const runGitCommands = createGitCommandRunner();
    const gitStatus = await getGitProjectStatus(context.projectPath);
    const mainBranch = (await getMainBranchName(context.projectPath)) || 'master';
    const currentBranch = gitStatus.branchName;
    context.mainBranch = mainBranch;
    context.currentBranch = currentBranch;

    if (currentBranch !== mainBranch) {
        if (gitStatus.status === GitStatusMap.Uncommitted) {
            logger.info('当前分支有未提交的代码，正在自动提交...');
            await runGitCommands(['git add .', gitActions.commit('save uncommitted changes before iteration')]);
        }
        logger.info(`切换到主干分支 ${mainBranch} 并拉取最新代码...`);
        await runGitCommands([gitActions.checkout(mainBranch), gitActions.pull()]);
    } else {
        // 已经在主分支，拉取前检查是否有未提交代码
        if (gitStatus.status === GitStatusMap.Uncommitted) {
            logger.info('当前分支有未提交的代码，正在自动提交...');
            await runGitCommands(['git add .', gitActions.commit('save uncommitted changes before iteration')]);
        }
        logger.info('拉取最新主干代码...');
        await runGitCommands([gitActions.pull()]);
    }

    return { mainBranch, currentBranch };
};

/**
 * 更新项目的 package.json 中的版本号
 * @returns Promise<void>
 */
const updatePackageVersions = async (): Promise<void> => {
    const { projectPath, pkgPath, finalVersion, isMono } = context;
    logger.info('正在更新 package.json 版本号...');

    const updatePackageJson = async (pPath: string, version: string) => {
        if (isDebug) {
            logger.info(`${isMono ? `子项目 ${path.basename(path.dirname(pPath))} ` : ''}更新版本号为 ${version}`);
            return;
        }
        if (await fs.pathExists(pPath)) {
            const packageData = await fs.readJSON(pPath);
            packageData.version = version;
            await fs.writeJSON(pPath, packageData, { spaces: 4 });
        }
    };

    await updatePackageJson(pkgPath, finalVersion);

    if (isMono) {
        const packagesDir = path.resolve(projectPath, 'packages');
        if (await fs.pathExists(packagesDir)) {
            const dirs = await fs.readdir(packagesDir);
            for (const dir of dirs) {
                const subPkgPath = path.resolve(packagesDir, dir, 'package.json');
                const stat = await fs.stat(path.resolve(packagesDir, dir));
                if (stat.isDirectory()) {
                    await updatePackageJson(subPkgPath, finalVersion);
                }
            }
        }
    }
};

/**
 * 提交并推送代码到远端
 * @returns Promise<void>
 */
const commitAndPushChanges = async (): Promise<void> => {
    const { finalVersion, targetBranch } = context;
    const runGitCommands = createGitCommandRunner();
    logger.info('提交版本变更并推送到远端...');
    await runGitCommands(['git add .', gitActions.commit(`chore:bump version to ${finalVersion}`)]);

    if (!context.shouldCreateBranch) {
        await runGitCommands([gitActions.push()]);
        logger.success(`成功推送到远程`);
    } else {
        await runGitCommands([gitActions.push(true, targetBranch)]);
        logger.success(`成功推送到远程并设置上游分支`);
    }
};

/**
 * iteration 命令的主编排流程
 * @param options 命令选项
 * @returns Promise<void>
 */
export const iterationService = async (options: IterationOptions): Promise<void> => {
    const { fix = false, version: versionArg } = options;
    const projectPath = process.cwd();
    const pkgPath = path.resolve(projectPath, 'package.json');

    if (!fs.existsSync(pkgPath)) {
        logger.error('未找到 package.json 文件');
        return;
    }

    if (isDebug) {
        logger.info(chalk.bgBlue.white(' === DEBUG 模式 (Dry Run) === '));
    }

    try {
        const pkg = await fs.readJSON(pkgPath);
        const currentVersion = pkg.version;
        // 构建上下文
        context = {
            projectPath,
            pkgPath,
            currentVersion,
            newVersion: '',
            finalVersion: '',
            mainBranch: '',
            currentBranch: '',
            targetBranch: '',
            isMono: await isMonorepo(projectPath),
            isGithub: await isGithubProject(projectPath),
            fix,
        };
        // 创建策略
        const strategy = createIterationStrategy(context);
        logger.info(`检测到项目类型: ${strategy.name}`);

        // 计算版本号
        const releaseType = strategy.getReleaseType();
        context.newVersion = calculateNewVersion(currentVersion, versionArg, releaseType);
        context.finalVersion = context.newVersion;

        // 获取目标分支（初始）
        context.targetBranch = strategy.getTargetBranch(context.mainBranch, context.finalVersion);
        logger.info(`当前版本: ${chalk.green(currentVersion)}`);
        logger.info(`新版本: ${chalk.green(context.finalVersion)}`);

        // 1. 前置检查与主干切换
        await prepareMainBranch();

        // 2. 开发分支策略
        context.targetBranch = strategy.getTargetBranch(context.mainBranch, context.finalVersion);
        const runGitCommands = createGitCommandRunner();
        const isBranchExist = await checkBranchExist(context.targetBranch);
        context.shouldCreateBranch = !isBranchExist;
        if (fix) {
            logger.info(`修复模式: 保持在 ${context.mainBranch} 分支进行更新`);
            context.targetBranch = context.mainBranch;
        } else if (context.isGithub) {
            // GitHub 项目先检查分支是否存在
            await strategy.validate?.(context);
            if (isDebug) {
                logger.info(`跳过切换分支操作`);
            } else {
                const cmd = gitActions.checkout(context.targetBranch, !isBranchExist);
                logger.info(`切换到 ${context.targetBranch} 分支...`);
                await runGitCommands([cmd]);
            }
        } else {
            // 公司项目需要验证分支是否存在
            if (typeof strategy.validate === 'function') {
                await strategy.validate(context);
            }
            logger.info(`基于主干创建并切换到 ${context.targetBranch} 分支...`);
            await runGitCommands([gitActions.checkout(context.targetBranch, true)]);
        }

        // 3. 更新版本号
        await updatePackageVersions();

        // 4. 提交并推送
        await commitAndPushChanges();

        // 5. Debug 输出
        if (isDebug) {
            return;
        }

        logger.success(`操作完成！当前处于 ${context.targetBranch} 分支，版本号已更新为 ${context.finalVersion}`);
    } catch (error) {
        logger.error(`操作失败: ${(error as Error).message}`);
    }
};
