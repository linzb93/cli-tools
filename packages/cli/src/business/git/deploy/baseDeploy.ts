import { execaCommand as execa } from 'execa';
import { executeCommands } from '@/utils/execuate-command-line';
import gitActions from '../shared/utils/actions';
import {
    getCurrentBranchName,
    getMainBranchName,
    isCurrenetBranchPushed,
    getGitProjectStatus,
    GitStatusMap,
    isGitProject as checkIsGitProject,
} from '../shared/utils';
import { logger } from '@/utils/logger';
import inquirer from '@/utils/inquirer';
import { checkHardcoded } from '../shared/utils/hard-coded';
import { getDeployCwd } from './context';

/**
 * Deploy命令选项接口
 */
export interface DeployOptions {
    /**
     * 是否发布到master或main分支
     * @default false
     */
    prod?: boolean;
    /**
     * 项目类型，用于标记tag
     */
    type?: string;
    /**
     * 项目版本号，用于标记tag
     */
    version?: string;
    /**
     * 是否打开对应的jenkins主页
     * @default false
     */
    open?: boolean;
    /**
     * git commit提交信息
     */
    commit: string;
    /**
     * 仅完成基础命令后结束任务
     * @default false
     */
    current?: boolean;
    /**
     * 工作目录路径，不作为命令行选项传入
     * @default process.cwd()
     */
    cwd?: string;
}

/**
 * 检查是否有未提交的更改
 * @returns {Promise<boolean>} 是否有未提交的更改
 */
export const hasChanges = async (): Promise<boolean> => {
    try {
        const { stdout } = await execa('git status -s', { cwd: getDeployCwd() });
        return stdout.trim() !== '';
    } catch (error) {
        logger.error('检查未提交更改失败');
        return false;
    }
};

/**
 * 完成基础git命令（add, commit, pull, push）
 * @param {string} commitMessage - 提交信息
 * @param {string} currentBranch - 当前分支名称
 * @returns {Promise<void>}
 */
export const executeBaseManagers = async (commitMessage: string, currentBranch: string): Promise<void> => {
    logger.info('执行基础Git命令...');
    const cwd = getDeployCwd();

    try {
        const gitStatus = await getGitProjectStatus();

        if (gitStatus.status === GitStatusMap.Uncommitted) {
            if (await checkHardcoded()) {
                logger.error('发现硬编码，禁止提交', true);
            }
            await executeCommands(['git add .', gitActions.commit(commitMessage)], { cwd, silentStart: true });
        }

        // 检查当前分支是否已推送到远端
        let isBranchPushed = await isCurrenetBranchPushed();

        // 根据分支推送状态决定是否添加 pull 命令
        if (isBranchPushed) {
            await executeCommands([gitActions.pull()], { cwd, silentStart: true });

            // 检查Pull后是否有未提交的更改（如合并产生的未提交更改）
            if (await hasChanges()) {
                await executeCommands(['git add .', gitActions.commit('合并代码')], { cwd, silentStart: true });
            }
        }

        // 根据分支是否已推送到远端决定push方式
        if (isBranchPushed) {
            await executeCommands([gitActions.push()], { cwd, silentStart: true });
        } else {
            await executeCommands([gitActions.push(true, currentBranch)], { cwd, silentStart: true });
        }

        logger.success('基础Git命令执行完成');
    } catch (error) {
        logger.error('基础Git命令执行失败，部署结束。');
        throw error;
    }
};

/**
 * 合并到指定分支
 * @param {string} targetBranch - 目标分支
 * @param {string} currentBranch - 当前分支
 * @param {boolean} [switchBackToBranch=false] - 是否切换回原分支
 * @returns {Promise<void>}
 */
export const mergeToBranch = async (
    targetBranch: string,
    currentBranch: string,
    switchBackToBranch: boolean = false,
): Promise<void> => {
    logger.info(`合并代码到 ${targetBranch} 分支...`);
    const cwd = getDeployCwd();

    try {
        // 保存当前分支
        await execa(`git checkout ${targetBranch}`, { cwd });
        await executeCommands([gitActions.pull(), gitActions.merge(currentBranch), gitActions.push()], { cwd });

        // 根据参数决定是否切回原分支
        if (switchBackToBranch) {
            await execa(`git checkout ${currentBranch}`, { cwd });
        }

        logger.success(`代码已成功合并到 ${targetBranch} 分支`);
    } catch (error) {
        // 如果需要切换回原始分支，并且出现错误
        if (switchBackToBranch) {
            try {
                await execa(`git checkout ${currentBranch}`, { cwd });
            } catch (checkoutError) {
                logger.error('切回原始分支失败');
            }
        }

        logger.error(`合并到 ${targetBranch} 分支失败`);
        throw error;
    }
};

/**
 * 初始化分支信息
 * @returns {Promise<{currentBranch: string, mainBranch: string}>}
 */
export const initBranchInfo = async (): Promise<{ currentBranch: string; mainBranch: string }> => {
    // 检查是否是Git项目
    const isGit = await checkIsGitProject();
    if (!isGit) {
        throw new Error('当前目录不是Git项目');
    }

    // 获取当前分支
    const currentBranch = await getCurrentBranchName();
    if (!currentBranch) {
        throw new Error('获取当前分支失败');
    }

    // 获取主分支
    let mainBranch = await getMainBranchName();
    if (!mainBranch) {
        mainBranch = 'master'; // 默认使用master
    }

    return { currentBranch, mainBranch };
};

/**
 * 处理用户输入
 * @param {DeployOptions} options - 命令选项
 * @returns {Promise<string>} 提交信息
 */
export const handleUserInput = async (options: DeployOptions): Promise<string> => {
    // 检查是否有未提交的更改
    const changed = await hasChanges();

    if (!changed && !options.commit) {
        // 询问用户提供commit信息
        const { commitMessage } = await inquirer.prompt([
            {
                type: 'input',
                name: 'commitMessage',
                message: '请输入commit信息:',
                validate: (input: string) => !!input || '提交信息不能为空',
            },
        ]);

        return commitMessage;
    }

    return options.commit;
};
