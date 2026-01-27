import BaseService from '../../core/BaseService.abstract';
import gitAtom from '../utils/atom';
import { executeCommands } from '../../../utils/promise';
import chalk from 'chalk';

/**
 * git clone 命令的选项接口
 */
export interface Options {
    repo: string;
    dir?: string;
}

/**
 * git clone 命令的实现类
 */
export class CloneService extends BaseService {
    /**
     * 命令的主入口函数
     * @param {Options} options - 命令选项
     * @returns {Promise<void>}
     */
    async main(options: Options): Promise<void> {
        const { repo, dir } = options;

        try {
            this.logger.info(`正在克隆仓库: ${chalk.green(repo)}`);
            if (dir) {
                this.logger.info(`目标目录: ${chalk.green(dir)}`);
            }

            // 执行 git clone 命令
            await executeCommands([gitAtom.clone(repo, dir)]);

            this.logger.success('仓库克隆成功');
        } catch (error) {
            this.logger.error(`克隆失败: ${error.message || error}`);
        }
    }
}
