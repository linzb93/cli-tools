import { Options, CdHistoryItem } from '../types';
import { sql } from '@cli-tools/shared';
import path from 'node:path';

/**
 * 解析目标路径，返回最终跳转的绝对路径
 * @param targetPath - 目标路径（可以是相对路径、数字索引或目录名）
 * @param options - cd 命令选项
 * @returns 解析后的绝对路径
 */
export async function resolveTargetPath(targetPath: string, options?: Options): Promise<string> {
    let resolvedPath = targetPath;

    // 如果输入的是纯数字索引，尝试从历史记录中匹配
    if (/^\d+$/.test(targetPath)) {
        const index = parseInt(targetPath, 10) - 1;
        const history: CdHistoryItem[] = await sql((data) => data.cdHistory || []);
        const topHistory = [...history].sort((a, b) => b.count - a.count).slice(0, 10);

        if (index >= 0 && index < topHistory.length) {
            resolvedPath = topHistory[index].path;
        }
        // 如果索引超出范围，保持 resolvedPath 不变（即 targetPath 原值），继续当作目录名处理
    }

    // Resolve absolute path
    let absolutePath = path.resolve(process.cwd(), resolvedPath);

    // --cwd 选项：如果路径中包含 src 目录，则跳转到 src 的上一级
    if (options?.cwd) {
        const parts = absolutePath.split(path.sep).filter(Boolean);
        const srcIndex = parts.indexOf('src');
        if (srcIndex !== -1) {
            absolutePath = parts.slice(0, srcIndex).join(path.sep) || path.sep;
        }
    } else {
        const root = await sql((db) => db.open.root);
        if (absolutePath.startsWith(root)) {
            // 跳转到这个地址距离root下两层目录
            const rootLength = root.split(path.sep).filter(Boolean).length;
            absolutePath = absolutePath
                .split(path.sep)
                .filter(Boolean)
                .slice(0, rootLength + 2)
                .join(path.sep);
        }
    }

    return absolutePath;
}
