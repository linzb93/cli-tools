import gitAtom from '../shared/utils/atom';
import { executeCommands } from '@cli-tools/shared/utils/promise';
import chalk from 'chalk';
import { logger } from '@cli-tools/shared/utils/logger';

/**
 * git clone 命令的选项接口
 */
export interface Options {
    repo: string;
    dir?: string;
}

/**
 * git clone 命令的实现
 * @param {Options} options - 命令选项
 * @returns {Promise<void>}
 */
export const cloneService = async (options: Options): Promise<void> => {
    const { repo, dir } = options;

    try {
        logger.info(`正在克隆仓库: ${chalk.green(repo)}`);
        if (dir) {
            logger.info(`目标目录: ${chalk.green(dir)}`);
        }

        // 执行 git clone 命令
        await executeCommands([gitAtom.clone(repo, dir)]);

        logger.success('仓库克隆成功');
    } catch (error: any) {
        logger.error(`克隆失败: ${error.message || error}`);
    }
};
