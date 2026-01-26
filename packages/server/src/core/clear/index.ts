import del from 'del';
import { globby } from 'globby';
import pMap from 'p-map';
import BaseManager from '../BaseManager';
export interface IOptions {
    root?: boolean;
    help?: boolean;
}

// 主要是来清理Windows上被Git同步过来的 macOS 的 .DS_Store
export class ClearManager extends BaseManager {
    /**
     * 主函数，执行清理逻辑
     * @param {string} filename - 要清理的文件名
     * @param {IOptions} options - 选项
     * @returns {Promise<void>}
     */
    async main(filename: string, options: IOptions) {
        if (options?.root) {
            await del(filename);
            this.logger.success(`${filename}已删除`);
            return;
        }
        const paths = await this.getMatchPaths(filename);
        const len = paths.length;
        if (len === 0) {
            this.logger.info('未发现需要删除的文件');
            return;
        }
        await pMap(paths as string[], async (file) => del(file), {
            concurrency: 10,
        });
        this.logger.success(`操作成功，共删除${len}个文件`);
    }

    /**
     * 获取匹配的文件路径
     * @param {string} filename - 文件名
     * @returns {Promise<string[]>} 匹配的文件路径列表
     */
    getMatchPaths(filename: string) {
        return globby([`**/*/${filename}`, '!node_modules']);
    }
}
