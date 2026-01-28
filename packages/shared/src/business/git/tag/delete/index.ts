import BaseService from '../../../core/BaseService.abstract';
import { isGitProject, getAllTags, deleteTags } from '../../shared/utils';

/**
 * 删除Git标签的类
 */
export class TagDeleteService extends BaseService {
    /**
     * 命令的主入口函数
     * @returns {Promise<void>}
     */
    async main(): Promise<void> {
        await this.execute();
    }

    /**
     * 执行删除标签操作
     * @returns {Promise<void>}
     */
    private async execute(): Promise<void> {
        // 检查当前目录是否是 Git 项目
        if (!(await isGitProject())) {
            this.logger.error('当前目录不是 Git 项目');
            return;
        }

        try {
            // 获取所有标签
            const tags = await getAllTags();

            if (tags.length === 0) {
                this.logger.warn('当前项目没有标签');
                return;
            }

            // 提示用户选择要删除的标签
            const { selectedTags } = await this.inquirer.prompt({
                type: 'checkbox',
                name: 'selectedTags',
                message: '请选择要删除的标签',
                choices: tags.map((tag) => ({ name: tag, value: tag })),
            });

            if (!selectedTags.length) {
                this.logger.info('未选择任何标签，操作已取消');
                return;
            }

            this.logger.info(`正在删除选中的 ${selectedTags.length} 个标签...`);
            await deleteTags({ tags: selectedTags, remote: true });
            this.logger.success('标签删除操作完成');
        } catch (error) {
            this.logger.error(`删除标签失败: ${error.message || error}`);
        }
    }
}
