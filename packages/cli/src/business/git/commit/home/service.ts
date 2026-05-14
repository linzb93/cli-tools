import { logger } from '@/utils/logger';
import { isGitProject } from '../../shared/utils';
import gitActions, { getPrefixValues } from '../../shared/utils/actions';
import { executeCommands, type Command } from '@/utils/execute-command-line';
import { checkHardcoded } from '../../shared/utils/hard-coded';
import type { Options } from './types';
import { splitGitLog } from '../../shared/utils';
import inquirer from '@/utils/inquirer';

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
        let finalMessage = message || '更新代码';

        // 处理 --select 选项，让用户选择前缀
        if (options.select) {
            const prefixValues = getPrefixValues();
            const { selected } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'selected',
                    message: '请选择提交前缀：',
                    choices: prefixValues,
                },
            ]);
            finalMessage = `${selected}:${finalMessage}`;
        } else {
            // 使用 formatCommitMessageWithSuggestion 检测并建议最近的前缀匹配
            const { commit: formattedCommit, suggestedPrefix } = await gitActions.formatCommitMessageWithSuggestion(finalMessage);

            // 如果检测到非标准前缀，提示用户确认
            if (suggestedPrefix) {
                const { confirmed } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirmed',
                        message: `检测到非标准前缀，已自动纠正为 "${suggestedPrefix}:"，是否继续？`,
                        default: true,
                    },
                ]);
                if (!confirmed) {
                    logger.info('已取消提交');
                    return;
                }
                finalMessage = formattedCommit;
            } else {
                finalMessage = formattedCommit;
            }
        }

        let commands: Command[] = [`git add ${commitPath}`, gitActions.commit(finalMessage)];
        if (options.merge && !message) {
            const arr = await splitGitLog({ head: 1 });
            const lastCommit = arr[0].message;
            commands = commands.concat(gitActions.mergePrev({ message: lastCommit, path: commitPath, head: 2 }));
        }
        await executeCommands(commands);

        logger.success('提交成功');
    } catch (error) {
        logger.error(`提交失败: ${(error as Error).message}`);
    }
};
