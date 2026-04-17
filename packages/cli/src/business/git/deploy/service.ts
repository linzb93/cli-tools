import { logger } from '@/utils/logger';
import dayjs from 'dayjs';
import chalk from 'chalk';
import { timeMsFormat } from '@/utils/helper';
import { getCurrentBranchName, getMainBranchName, isGitProject as checkIsGitProject } from '../shared/utils';
import { Factory } from './core/Factory';
import { setContext } from './shared';
import type { DeployOptions } from './types';
import { checkHardcoded } from '../shared/utils/hard-coded';

/**
 * 初始化分支信息
 * @returns {Promise<void>}
 */
export const initBranchInfo = async (): Promise<void> => {
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
    setContext({ currentBranch, mainBranch });
};
/**
 * Git Deploy命令主函数
 * @param {DeployOptions} options - 命令选项
 */
export const deployService = async (options: Partial<DeployOptions>): Promise<void> => {
    const startTime = dayjs();
    try {
        // 检查是否有硬编码的配置
        const hasHardcoded = await checkHardcoded(options.cwd || process.cwd());
        if (hasHardcoded) {
            logger.error('项目包含硬编码的配置，无法部署');
            process.exit(1);
        }
        await initBranchInfo();
        // 设置提交信息
        setContext({ commit: options.commit || 'update' });
        (await Factory.create()).start();
        const endTime = dayjs();
        const duration = endTime.diff(startTime, 'millisecond');
        console.log(
            `${chalk.gray(`[${endTime.format('HH:mm:ss')}]`)} 任务执行完成，用时${chalk.magenta(timeMsFormat(duration))}`,
        );
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
