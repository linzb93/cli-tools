import { logger } from '@/utils/logger';
import chalk from 'chalk';
import readline from 'node:readline';
import type { TagMapping } from './service';

export const getBatchEditInput = async (): Promise<TagMapping[]> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const question = (prompt: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(prompt, (answer: string) => {
                resolve(answer.trim());
            });
        });
    };

    const tagMappings: TagMapping[] = [];

    logger.info(chalk.blue('批量标签修改工具'));
    logger.info('请输入要修改的标签对（格式：原标签 -> 新标签）');
    logger.info('输入 "done" 完成输入，输入 "cancel" 取消操作');
    logger.info('');

    try {
        while (true) {
            const input = await question('标签修改 (原标签 -> 新标签): ');

            if (input.toLowerCase() === 'done') {
                break;
            }

            if (input.toLowerCase() === 'cancel') {
                logger.info('操作已取消');
                rl.close();
                return [];
            }

            if (!input.includes('->')) {
                logger.warn('格式错误！请使用 "原标签 -> 新标签" 的格式');
                continue;
            }

            const parts = input.split('->').map((part) => part.trim());
            if (parts.length !== 2 || !parts[0] || !parts[1]) {
                logger.warn('格式错误！请确保原标签和新标签都不为空');
                continue;
            }

            const [from, to] = parts;

            if (from.toLowerCase() === to.toLowerCase()) {
                logger.warn('原标签和新标签相同，跳过此项');
                continue;
            }

            const existingMapping = tagMappings.find((mapping) => mapping.from.toLowerCase() === from.toLowerCase());

            if (existingMapping) {
                logger.warn(`标签 "${from}" 已经设置过修改，将更新为 "${to}"`);
                existingMapping.to = to;
            } else {
                tagMappings.push({ from, to });
                logger.info(`已添加: ${chalk.red(from)} → ${chalk.green(to)}`);
            }
        }

        rl.close();

        if (tagMappings.length === 0) {
            logger.warn('没有输入任何标签修改');
            return [];
        }

        logger.info('');
        logger.info('总结要修改的标签：');
        tagMappings.forEach((mapping, index) => {
            logger.info(`${index + 1}. ${chalk.red(mapping.from)} → ${chalk.green(mapping.to)}`);
        });

        const confirm = await question('\n确认执行这些修改吗？ (y/n): ');

        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
            logger.info('操作已取消');
            return [];
        }

        return tagMappings;
    } catch (error) {
        logger.error(`输入过程中出现错误: ${error}`);
        rl.close();
        return [];
    }
};
