import semver from 'semver';
import type { ReleaseType } from 'semver';
import { isDebug } from '../shared';
import type { IterationOptions } from '../types';
import chalk from 'chalk';
import fs from 'fs-extra';
import { logger } from '@/utils/logger';
import { executeCommands } from '@/utils/execuate-command-line';
import { updatePackageJSON } from '../delegates/updatePackageJSON';
import { getGitProjectStatus, GitStatusMap, getMainBranchName, checkBranchExist } from '../../shared/utils';
import gitActions from '../../shared/utils/actions';

interface ExtraStrategyOptions {
    /** 项目路径 */
    projectPath: string;
    /** package.json 路径 */
    pkgPath: string;
}

/**
 * 迭代策略抽象基类
 * 通过依赖注入接收三个策略委托
 */
export abstract class BaseStrategy {
    /** 策略名称 */
    abstract readonly name: string;
    /** 版本递增类型 */
    releaseType: ReleaseType = 'minor';
    /** 新版本号 */
    protected newVersion: string = '';
    /** 目标分支名 */
    private targetBranch: string = '';

    async run(options: IterationOptions & ExtraStrategyOptions) {
        const { version } = options;
        this.calculateNewVersion(version, options.pkgPath);
        await this.prepareMainBranch(options.projectPath);
        this.targetBranch = this.getTargetBranch();
        const isBranchExist = await checkBranchExist(this.targetBranch);
        await this.checkoutDevBranch(options.projectPath);

        // 3. 更新版本号
        await this.updateProjectPackageJSON({
            projectPath: options.projectPath,
            pkgPath: options.pkgPath,
            version: this.newVersion,
        });

        // 4. 提交并推送
        await this.commitAndPushChanges(isBranchExist);
        // 5. Debug 输出
        if (isDebug) {
            return;
        }
        logger.success(`操作完成！当前处于 ${this.targetBranch} 分支，版本号已更新为 ${this.newVersion}`);
    }
    /**
     * 计算新版本号
     * @param versionArg 传入的目标版本参数
     * @returns 计算出的新版本号
     */
    async calculateNewVersion(versionArg: string | undefined, pkgPath: string) {
        const { releaseType } = this;
        const pkg = await fs.readJSON(pkgPath);
        const currentVersion = pkg.version;
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
        this.newVersion = newVersion;
        logger.info(`当前版本: ${chalk.green(currentVersion)}`);
        logger.info(`新版本: ${chalk.green(newVersion)}`);
    }
    /**
     * 获取目标分支名称
     * @returns 目标分支名称
     */
    getTargetBranch(): string {
        return 'dev';
    }
    /**
     * 检查当前分支并切换到主分支拉取最新代码
     * @returns Promise<void>
     */
    private async prepareMainBranch(projectPath: string): Promise<void> {
        const gitStatus = await getGitProjectStatus(projectPath);
        const mainBranch = await getMainBranchName(projectPath);
        const currentBranch = gitStatus.branchName;
        if (gitStatus.status === GitStatusMap.Uncommitted) {
            logger.info('当前分支有未提交的代码，正在自动提交...');
            await executeCommands(['git add .', gitActions.commit('save uncommitted changes before iteration')]);
        }
        if (currentBranch !== mainBranch) {
            logger.info(`切换到主干分支 ${mainBranch} 并拉取最新代码...`);
            await executeCommands([gitActions.checkout(mainBranch), gitActions.pull()]);
        } else {
            // 已经在主分支，拉取前检查是否有未提交代码
            logger.info('拉取最新主干代码...');
            await executeCommands([gitActions.pull()]);
        }
    }
    /**
     * 切换到目标开发分支
     * @param {string} projectPath 项目路径
     * @returns Promise<void>
     */
    private async checkoutDevBranch(projectPath: string): Promise<void> {
        const { targetBranch } = this;
        const isBranchExist = await checkBranchExist(targetBranch, projectPath);
        if (!isBranchExist) {
            if (isDebug) {
                logger.info(`目标开发分支 ${targetBranch} 未创建，需要创建。`);
            } else {
                logger.info(`本地不存在 ${targetBranch} 分支，将新建...`);
            }
            await executeCommands([gitActions.checkout(targetBranch, true)]);
            return;
        }
        await executeCommands([gitActions.checkout(targetBranch)]);
    }
    /**
     * 更新项目的 package.json 中的版本号
     * @param pkgPath package.json 文件路径
     * @param version 目标版本号
     * @returns Promise<void>
     */
    async updateProjectPackageJSON({
        projectPath,
        pkgPath,
        version,
    }: {
        projectPath: string;
        pkgPath: string;
        version: string;
    }) {
        await updatePackageJSON(projectPath, pkgPath, version);
    }
    /**
     * 提交并推送代码到远端仓库
     * @param {boolean} isBranchExist 目标分支是否存在
     * @returns Promise<void>
     */
    async commitAndPushChanges(isBranchExist: boolean): Promise<void> {
        const { newVersion, targetBranch } = this;
        logger.info('提交版本变更并推送到远端...');
        await executeCommands(['git add .', gitActions.commit(`chore:bump version to ${newVersion}`)]);

        if (isBranchExist) {
            await executeCommands([gitActions.push()]);
            logger.success(`成功推送到远程`);
        } else {
            await executeCommands([gitActions.push(true, targetBranch)]);
            logger.success(`成功推送到远程并设置上游分支`);
        }
    }
}
