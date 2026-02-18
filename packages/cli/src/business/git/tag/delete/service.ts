import { logger } from '@/utils/logger';
import inquirer from '@/utils/inquirer';
import { isGitProject, getAllTags, deleteTags } from '../../shared/utils';

export const tagDeleteService = async (): Promise<void> => {
    // 检查当前目录是否是 Git 项目
    if (!(await isGitProject())) {
        logger.error('当前目录不是 Git 项目');
        return;
    }

    try {
        // 获取所有标签
        const tags = await getAllTags();

        if (tags.length === 0) {
            logger.warn('当前项目没有标签');
            return;
        }

        // 提示用户选择要删除的标签
        const { selectedTags } = await inquirer.prompt({
            type: 'checkbox',
            name: 'selectedTags',
            message: '请选择要删除的标签',
            choices: tags.map((tag) => ({ name: tag, value: tag })),
        });

        if (!selectedTags.length) {
            logger.info('未选择任何标签，操作已取消');
            return;
        }

        logger.info(`正在删除选中的 ${selectedTags.length} 个标签...`);
        await deleteTags({ tags: selectedTags, remote: true });
        logger.success('标签删除操作完成');
    } catch (error) {
        logger.error(`删除标签失败: ${error.message || error}`);
    }
};