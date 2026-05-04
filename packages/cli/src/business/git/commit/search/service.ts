import { logger } from '@/utils/logger';
import type { Options as SearchOptions } from './types';
import { isGitProject } from '../../shared/utils';
import { splitGitLog } from '../../shared/utils/log';
import Table from 'cli-table3';
/**
 * git commit search 命令的主入口函数
 * @param {string} keyword - 搜索关键词
 * @returns {Promise<void>}
 */
export const commitSearchService = async (options: SearchOptions): Promise<void> => {
    const { keyword } = options;
    // 检查当前目录是否是 Git 项目
    if (!(await isGitProject())) {
        logger.error('当前目录不是 Git 项目');
        return;
    }
    const arr = await splitGitLog({
        head: options.head || 10,
        keyword,
        cwd: options.cwd,
    });
    const table = new Table({
        head: ['日期', '提交内容'],
        colWidths: [30, 60],
    });
    arr.forEach((item) => {
        table.push([item.date, item.message]);
    });
    console.log(table.toString());
};
