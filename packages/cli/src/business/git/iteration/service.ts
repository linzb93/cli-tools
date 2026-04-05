import { logger } from '@/utils/logger';
import { executeCommands } from '@/utils/promise';
import fs from 'fs-extra';
import path from 'node:path';
import semver from 'semver';
import chalk from 'chalk';
import gitActions from '../shared/utils/actions';
import { getGitProjectStatus, GitStatusMap, getMainBranchName, isCurrenetBranchPushed } from '../shared/utils';
import { createIterationStrategy } from './core/Factory';
import type { IterationContext, IterationOptions } from './types';

/** 模块级变量 */
let isDebug = false;
let commandsToRun: any[] = [];

/**
 * 创建 Git 命令运行器（不可变，内部判断 debug 模式）
 * @returns Git 命令执行函数
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
 * @param ctx 迭代上下文
 * @returns Promise<{ mainBranch: string; currentBranch: string }>
 */
const prepareMainBranch = async (ctx: IterationContext): Promise<{ mainBranch: string; currentBranch: string }> => {
    const runGitCommands = createGitCommandRunner();
    const gitStatus = await getGitProjectStatus(ctx.projectPath);
    const mainBranch = (await getMainBranchName(ctx.projectPath)) || 'master';
    const currentBranch = gitStatus.branchName;
    ctx.mainBranch = mainBranch;
    ctx.currentBranch = currentBranch;

    if (currentBranch !== mainBranch) {
        if (gitStatus.status === GitStatusMap.Uncommitted) {
            logger.info('当前分支有未提交的代码，正在自动提交...');
            await runGitCommands(['git add .', gitActions.commit('save uncommitted changes before iteration')]);
        }
        logger.info(`切换到主干分支 ${mainBranch} 并拉取最新代码...`);
        await runGitCommands([`git checkout ${mainBranch}`, gitActions.pull()]);
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
 * @param ctx 迭代上下文
 * @returns Promise<void>
 */
const updatePackageVersions = async (ctx: IterationContext): Promise<void> => {
    const { projectPath, pkgPath, finalVersion, isMono } = ctx;
    logger.info('正在更新 package.json 版本号...');
    const runGitCommands = createGitCommandRunner();

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
 * @param ctx 迭代上下文
 * @returns Promise<void>
 */
const commitAndPushChanges = async (ctx: IterationContext): Promise<void> => {
    const { finalVersion, targetBranch, isGithub } = ctx;
    const runGitCommands = createGitCommandRunner();
    logger.info('提交版本变更并推送到远端...');
    await runGitCommands(['git add .', gitActions.commit(`bump version to ${finalVersion}`)]);

    if (isDebug) {
        await runGitCommands([gitActions.push(true, targetBranch)]);
        logger.info('预计将执行上述 Git 命令。');
        return;
    }

    if (await isCurrenetBranchPushed()) {
        await runGitCommands([gitActions.push()]);
        logger.success(`成功推送到远程`);
    } else {
        await runGitCommands([gitActions.push(true, targetBranch)]);
        logger.success(`成功推送到远程并设置上游分支`);
    }
};

/**
 * 打印 Dry Run 结果
 * @param ctx 迭代上下文
 */
const printDryRunResult = (ctx: IterationContext): void => {
    const { currentBranch, targetBranch, currentVersion, finalVersion } = ctx;
    logger.info(chalk.cyan('\n=== Dry Run 执行结果 ==='));
    logger.info(`当前分支: ${currentBranch}`);
    logger.info(`目标分支: ${targetBranch}`);
    logger.info(`项目原版本: ${currentVersion}`);
    logger.info(`项目新版本: ${finalVersion}`);
    logger.info(`计划执行的 Git 命令:`);
    commandsToRun.forEach((cmd, idx) => {
        const cmdStr = typeof cmd === 'string' ? cmd : cmd.message;
        logger.info(`  ${idx + 1}. ${cmdStr}`);
    });
    logger.info(chalk.cyan('========================\n'));
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

    // 初始化模块级变量
    const isDebug = options.debug;
    commandsToRun = [];

    if (isDebug) {
        logger.info(chalk.bgBlue.white(' === DEBUG 模式 (Dry Run) === '));
    }

    if (!fs.existsSync(pkgPath)) {
        logger.error('未找到 package.json 文件');
        return;
    }

    try {
        // 创建策略
        const strategy = await createIterationStrategy(projectPath);
        logger.info(`检测到项目类型: ${strategy.name}`);

        const pkg = await fs.readJSON(pkgPath);
        const currentVersion = pkg.version;

        // 构建上下文
        const ctx: IterationContext = {
            projectPath,
            pkgPath,
            currentVersion,
            newVersion: '',
            finalVersion: '',
            mainBranch: '',
            currentBranch: '',
            targetBranch: '',
            isMono: false,
            isGithub: false,
            fix,
            isDebug,
        };

        // 判断项目类型
        ctx.isGithub = projectPath.includes('github') || process.cwd().includes('github');
        ctx.isMono =
            !!path.resolve(projectPath, 'packages') && (await fs.pathExists(path.resolve(projectPath, 'packages')));

        // 计算版本号
        const releaseType = strategy.getReleaseType();
        ctx.newVersion = calculateNewVersion(currentVersion, versionArg, releaseType);
        ctx.finalVersion = ctx.newVersion;

        // 获取目标分支（初始）
        ctx.targetBranch = strategy.getTargetBranch(ctx.mainBranch, ctx.finalVersion);

        logger.info(`项目类型: ${ctx.isGithub ? 'GitHub' : '公司'}${ctx.isMono ? ' Monorepo' : ' 普通项目'}`);
        logger.info(`当前版本: ${chalk.green(currentVersion)}`);
        logger.info(`新版本: ${chalk.green(ctx.finalVersion)}`);

        // 1. 前置检查与主干切换
        await prepareMainBranch(ctx);

        // 2. 开发分支策略
        ctx.targetBranch = strategy.getTargetBranch(ctx.mainBranch, ctx.finalVersion);
        const runGitCommands = createGitCommandRunner();

        if (fix) {
            logger.info(`修复模式: 保持在 ${ctx.mainBranch} 分支进行更新`);
            ctx.targetBranch = ctx.mainBranch;
        } else if (ctx.isGithub) {
            // GitHub 项目先检查分支是否存在
            await strategy.validate!(ctx);
            const shouldCreate = (ctx as any).shouldCreateBranch;
            const cmd = shouldCreate ? `git checkout -b ${ctx.targetBranch}` : `git checkout ${ctx.targetBranch}`;
            logger.info(`切换到 ${ctx.targetBranch} 分支...`);
            await runGitCommands([cmd]);
        } else {
            // 公司项目需要验证分支是否存在
            if (strategy.validate) {
                await strategy.validate(ctx);
            }
            logger.info(`基于主干创建并切换到 ${ctx.targetBranch} 分支...`);
            await runGitCommands([`git checkout -b ${ctx.targetBranch}`]);
        }

        // 3. 更新版本号
        await updatePackageVersions(ctx);

        // 4. 提交并推送
        await commitAndPushChanges(ctx);

        // 5. Debug 输出
        if (isDebug) {
            printDryRunResult(ctx);
            return;
        }

        logger.success(`操作完成！当前处于 ${ctx.targetBranch} 分支，版本号已更新为 ${ctx.finalVersion}`);
    } catch (error: any) {
        logger.error(`操作失败: ${error.message || error}`);
    }
};
