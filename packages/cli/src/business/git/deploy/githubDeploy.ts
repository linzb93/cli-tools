import { DeployOptions, executeBaseManagers, mergeToBranch } from './baseDeploy';

/**
 * 处理主分支的部署流程
 * @param {DeployOptions} options - 命令选项
 * @param {string} currentBranch - 当前分支
 * @returns {Promise<void>}
 */
const handleMainBranch = async (options: DeployOptions, currentBranch: string): Promise<void> => {
    // 在主分支上只需要执行基础命令
    await executeBaseManagers(options.commit, currentBranch);
};

/**
 * 处理非主分支的部署流程
 * @param {DeployOptions} options - 命令选项
 * @param {string} currentBranch - 当前分支
 * @param {string} mainBranch - 主分支
 * @returns {Promise<void>}
 */
const handleOtherBranch = async (options: DeployOptions, currentBranch: string, mainBranch: string): Promise<void> => {
    await executeBaseManagers(options.commit, currentBranch);

    // 如果指定了prod选项，合并到主分支
    if (options.prod) {
        await mergeToBranch(mainBranch, currentBranch, false);
    }
};

/**
 * Github项目部署逻辑
 * @param {DeployOptions} options - 命令选项
 * @param {string} currentBranch - 当前分支
 * @param {string} mainBranch - 主分支
 * @returns {Promise<void>}
 */
export const githubDeploy = async (options: DeployOptions, currentBranch: string, mainBranch: string): Promise<void> => {
    if (currentBranch === mainBranch) {
        await handleMainBranch(options, currentBranch);
    } else {
        await handleOtherBranch(options, currentBranch, mainBranch);
    }
};
