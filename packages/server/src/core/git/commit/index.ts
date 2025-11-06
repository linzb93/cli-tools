import BaseCommand from '../../BaseCommand';
import { isGitProject } from '../utils';
import gitAtom from '../atom';
import { executeCommands } from '@/utils/promise';

/**
 * git pull 命令的选项接口，无需参数
 */
export interface Options {
    path: string;
}

/**
 * git pull 命令的实现类
 */
export default class extends BaseCommand {
    /**
     * 命令的主入口函数
     * @param {string} message - 提交信息
     * @returns {Promise<void>}
     */
    async main(message: string, options: Options): Promise<void> {
        // 检查当前目录是否是 Git 项目
        if (!(await isGitProject())) {
            this.logger.error('当前目录不是 Git 项目');
            return;
        }

        try {
            // 执行 git commit 命令
            await executeCommands([
                `git add ${options.path ? options.path.replace(/\\/g, '/') || '.' : '.'}`,
                gitAtom.commit(message),
            ]);
            this.logger.success('提交成功');
        } catch (error) {
            this.logger.error(`提交失败: ${error.message || error}`);
        }
    }
}
