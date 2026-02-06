import { openDeployPage } from '../shared/utils/jenkins';
import { tagService, Options as TagOptions } from '../tag/get';
import { sleep } from '@linzb93/utils';
import path from 'node:path';
import fs from 'fs-extra';
import { logger } from '@cli-tools/shared/utils/logger';
import inquirer from '@cli-tools/shared/utils/inquirer';
import { DeployOptions, executeBaseManagers, mergeToBranch } from './baseDeploy';

/**
 * 处理标签和输出信息
 * @param {DeployOptions} options - 命令选项
 * @param {boolean} readFromPackage - 是否尝试从package.json读取版本号
 * @returns {Promise<void>}
 */
const handleTagAndOutput = async (options: DeployOptions, readFromPackage: boolean = false): Promise<void> => {
    let version = options.version;

    // 如果没有指定version，且允许读取package.json，尝试从package.json读取
    if (!version && readFromPackage) {
        try {
            const pkgPath = path.resolve(process.cwd(), 'package.json');
            if (await fs.pathExists(pkgPath)) {
                const pkg = await fs.readJson(pkgPath);
                version = pkg.version;
            }
        } catch (error) {
            // 读取失败则忽略，保持version为undefined
        }
    }

    // 创建tag选项
    const tagOptions: TagOptions = {
        type: options.type,
        version: version,
        msg: options.commit,
    };

    await tagService(tagOptions);
};

/**
 * 处理master分支的部署流程
 * @param {DeployOptions} options - 命令选项
 * @param {string} currentBranch - 当前分支
 * @returns {Promise<void>}
 */
const handleMasterBranch = async (options: DeployOptions, currentBranch: string): Promise<void> => {
    if (!options.current) {
        logger.warn('当前分支为master，将要发布项目');
        await sleep(1500);
    }
    await executeBaseManagers(options.commit, currentBranch);
    if (!options.current) {
        await handleTagAndOutput(options);
    }
    if (options.open) {
        await openDeployPage(options.type, true);
    }
};

/**
 * 处理release分支的部署流程
 * @param {DeployOptions} options - 命令选项
 * @param {string} currentBranch - 当前分支
 * @returns {Promise<void>}
 */
const handleReleaseBranch = async (options: DeployOptions, currentBranch: string): Promise<void> => {
    await executeBaseManagers(options.commit, currentBranch);

    // 打开Jenkins主页
    if (options.open !== false) {
        await openDeployPage(options.type);
    }
};

/**
 * 处理其他分支的部署流程
 * @param {DeployOptions} options - 命令选项
 * @param {string} currentBranch - 当前分支
 * @param {string} mainBranch - 主分支
 * @returns {Promise<void>}
 */
const handleOtherBranch = async (options: DeployOptions, currentBranch: string, mainBranch: string): Promise<void> => {
    await executeBaseManagers(options.commit, currentBranch);

    if (options.prod) {
        // 询问用户是否确认发布
        const { confirmDeploy } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmDeploy',
                message: `确认要发布项目吗？这将合并代码到${mainBranch}分支并发布`,
                default: false,
            },
        ]);

        if (!confirmDeploy) {
            logger.info('已取消发布操作');
            return;
        }
        // 合并到主分支
        await mergeToBranch(mainBranch, currentBranch, false);
        await handleTagAndOutput(options, true);
    } else if (!options.current) {
        // 合并到release分支
        await mergeToBranch('release', currentBranch, true);

        // 打开Jenkins主页
        if (options.open !== false) {
            await openDeployPage(options.type);
        }
    }
};

/**
 * 公司项目部署逻辑
 * @param {DeployOptions} options - 命令选项
 * @param {string} currentBranch - 当前分支
 * @param {string} mainBranch - 主分支
 * @returns {Promise<void>}
 */
export const companyDeploy = async (
    options: DeployOptions,
    currentBranch: string,
    mainBranch: string,
): Promise<void> => {
    if (currentBranch === mainBranch) {
        await handleMasterBranch(options, currentBranch);
    } else if (currentBranch === 'release') {
        await handleReleaseBranch(options, currentBranch);
    } else {
        await handleOtherBranch(options, currentBranch, mainBranch);
    }
};
