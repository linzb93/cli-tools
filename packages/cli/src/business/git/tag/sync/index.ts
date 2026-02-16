import { execa } from 'execa';
import { logger } from '@/utils/logger';
import { executeCommands, CommandConfig } from '@/utils/promise';
import { isGitProject, getAllTags } from '../../shared/utils';

const fetchTags = (): CommandConfig => {
    return {
        message: 'git fetch --tags',
        onError: async (message) => {
            console.error(`拉取远程标签失败: ${message}`);
            return {
                shouldStop: true,
            };
        },
    };
};

export const tagSyncService = async (): Promise<void> => {
    // 检查当前目录是否是 Git 项目
    if (!(await isGitProject())) {
        logger.error('当前目录不是 Git 项目');
        return;
    }

    try {
        // 获取所有标签
        const tags = await getAllTags();

        if (tags.length > 0) {
            logger.info(`正在删除 ${tags.length} 个本地标签...`);

            // 删除所有本地标签
            await execa('git', ['tag', '-d'].concat(tags));
        }

        // 拉取所有远程标签
        logger.info('正在从远程拉取所有标签...');
        await executeCommands([fetchTags()]);

        const updatedTags = await getAllTags();
        logger.success(`标签同步完成，现有 ${updatedTags.length} 个标签`);
    } catch (error) {
        logger.error(`同步标签失败: ${error.message || error}`);
    }
};
