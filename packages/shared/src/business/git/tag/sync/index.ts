import { execa } from 'execa';
import BaseService from '../../../core/BaseService.abstract';
import { isGitProject, getAllTags } from '../../shared/utils';
import { executeCommands, CommandConfig } from '../../../../utils/promise';

/**
 * 同步Git标签的类
 */
export class TagSyncService extends BaseService {
    /**
     * 命令的主入口函数
     * @returns {Promise<void>}
     */
    async main(): Promise<void> {
        // 检查当前目录是否是 Git 项目
        if (!(await isGitProject())) {
            this.logger.error('当前目录不是 Git 项目');
            return;
        }

        try {
            // 获取所有标签
            const tags = await getAllTags();

            if (tags.length > 0) {
                this.logger.info(`正在删除 ${tags.length} 个本地标签...`);

                // 删除所有本地标签
                await execa('git', ['tag', '-d'].concat(tags));
            }

            // 拉取所有远程标签
            this.logger.info('正在从远程拉取所有标签...');
            await executeCommands([this.fetchTags()]);

            const updatedTags = await getAllTags();
            this.logger.success(`标签同步完成，现有 ${updatedTags.length} 个标签`);
        } catch (error) {
            this.logger.error(`同步标签失败: ${error.message || error}`);
        }
    }

    /**
     * 拉取所有远程标签
     * @returns {CommandConfig} 命令配置
     */
    private fetchTags(): CommandConfig {
        return {
            message: 'git fetch --tags',
            onError: async (message) => {
                console.error(`拉取远程标签失败: ${message}`);
                return {
                    shouldStop: true,
                };
            },
        };
    }
}
