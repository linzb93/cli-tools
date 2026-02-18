import { logger } from '@/utils/logger';
import { DeployOptions, handleUserInput, initBranchInfo, isGithubProject } from './baseDeploy';
import { companyDeploy } from './companyDeploy';
import { githubDeploy } from './githubDeploy';

/**
 * Git Deploy命令主函数
 * @param {DeployOptions} options - 命令选项
 */
export const deployService = async (options: DeployOptions): Promise<void> => {
    try {
        options.commit = options.commit || 'update';

        // 处理用户输入
        const commitMsg = await handleUserInput(options);
        options.commit = commitMsg;

        // 初始化分支信息
        const { currentBranch, mainBranch } = await initBranchInfo();

        // 判断项目类型并执行相应部署
        const isGithub = await isGithubProject();

        if (isGithub) {
            await githubDeploy(options, currentBranch, mainBranch);
        } else {
            await companyDeploy(options, currentBranch, mainBranch);
        }

        logger.success('部署流程已完成');
    } catch (error) {
        if (error instanceof Error) {
            // 忽略 exit 错误，这通常是 inquirer 中断或主动退出
            if (error.message !== 'exit') {
                logger.error(error.message);
            }
        } else {
            logger.error('部署过程中发生未知错误');
        }
        process.exit(1);
    }
};