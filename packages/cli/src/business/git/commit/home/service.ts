import { logger } from '@/utils/logger';
import { isGitProject } from '../../shared/utils';
import gitActions from '../../shared/utils/actions';
import { executeCommands, type Command } from '@/utils/execute-command-line';
import { checkHardcoded } from '../../shared/utils/hard-coded';
import type { Options } from './types';
import { splitGitLog } from '../../shared/utils';

/**
 * git commit 命令的主入口函数
 * @param {Options} options - 选项
 * @returns {Promise<void>}
 */
export const commitService = async (options: Options): Promise<void> => {
    const { message } = options;
    // 检查当前目录是否是 Git 项目
    if (!(await isGitProject())) {
        logger.error('当前目录不是 Git 项目');
        return;
    }

    // 既没有输入提交信息，也没有 --merge 选项
    if (!message && !options.merge) {
        logger.error('请输入提交信息或使用 --merge 选项', true);
    }

    try {
        // 检查是否有硬编码
        if (await checkHardcoded()) {
            logger.error('发现硬编码，禁止提交', true);
        }
        const commitPath = options.path ? options.path.replace(/\\/g, '/') : '.';

        let commands: Command[] = [`git add ${commitPath}`, gitActions.commit(message)];
        if (options.merge && !message) {
            const arr = await splitGitLog({ head: 1 });
            const lastCommit = arr[0].message;
            commands = commands.concat(await gitActions.mergePrev({ message: lastCommit, path: commitPath, head: 2 }));
        }
        await executeCommands(commands);

        logger.success('提交成功');
    } catch (error) {
        logger.error(`提交失败: ${(error as Error).message}`);
    }
};
