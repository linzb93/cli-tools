import { Options, CdHistoryItem } from '../types';
import { sql } from '@cli-tools/shared/node';
import path from 'node:path';

/**
 * 路径解析函数数组，按顺序执行
 * 每个函数接收当前路径，返回处理后的路径
 */
const pathResolvers: Array<(path: string) => string | Promise<string>> = [
    /**
     * 检测路径中是否包含 packages 目录，如果有则跳转到其上一级
     */
    (absPath) => {
        const parts = absPath.split(path.sep).filter(Boolean);
        const pkgIndex = parts.indexOf('packages');
        return pkgIndex !== -1 ? parts.slice(0, pkgIndex).join(path.sep) || path.sep : absPath;
    },
    /**
     * 检测路径中是否包含 src 目录，如果有则跳转到其上一级
     */
    (absPath) => {
        const parts = absPath.split(path.sep).filter(Boolean);
        const srcIndex = parts.indexOf('src');
        return srcIndex !== -1 ? parts.slice(0, srcIndex).join(path.sep) || path.sep : absPath;
    },
    async (absPath) => {
        const root = await sql((db) => db.open.root);
        const formattedRoot = root.replace(/\//g, path.sep);
        if (absPath.startsWith(formattedRoot)) {
            const rootLength = formattedRoot.split(path.sep).filter(Boolean).length;
            return absPath
                .split(path.sep)
                .filter(Boolean)
                .slice(0, rootLength + 2)
                .join(path.sep);
        }
        return absPath;
    },
];

/**
 * 解析目标路径，返回最终跳转的绝对路径
 * @param targetPath - 目标路径（可以是相对路径、数字索引、别名或目录名）
 * @param options - cd 命令选项
 * @returns 解析后的绝对路径
 */
export async function resolveTargetPath(targetPath: string, options?: Options): Promise<string> {
    let resolvedPath = targetPath;

    // 获取历史记录
    const history: CdHistoryItem[] = await sql((data) => data.cdHistory || []);

    // 获取排序后的前10条历史记录
    const topHistory = [...history].sort((a, b) => b.count - a.count).slice(0, 10);

    // 如果输入的是纯数字索引，尝试从历史记录中匹配（支持负数）
    if (/^-?\d+$/.test(targetPath)) {
        const index = parseInt(targetPath, 10);

        if (index > 0) {
            // 正数：1-based 转 0-based
            if (index <= topHistory.length) {
                resolvedPath = topHistory[index - 1].path;
            }
        } else if (index < 0) {
            // 负数：从后面开始数，-1 是最后一个
            const negativeIndex = topHistory.length + index;
            if (negativeIndex >= 0 && negativeIndex < topHistory.length) {
                resolvedPath = topHistory[negativeIndex].path;
            }
        }
        // 如果索引超出范围，保持 resolvedPath 不变（即 targetPath 原值），继续当作目录名处理
    }

    // 如果输入的是关键字，尝试从历史记录中匹配路径包含该关键字的记录
    if (options?.keyword) {
        const match = topHistory.find((item) => item.path.includes(options.keyword!));
        if (match) {
            resolvedPath = match.path;
        }
    }

    // 如果输入的是别名，尝试从历史记录中匹配
    const aliasMatch = history.find((item) => item.alias === targetPath);
    if (aliasMatch) {
        resolvedPath = aliasMatch.path;
    }

    // Resolve absolute path
    let absolutePath = path.resolve(process.cwd(), resolvedPath);

    // --cwd 选项：遍历 pathResolvers 依次解析路径，匹配成功则停止
    if (options?.cwd) {
        for (const resolver of pathResolvers) {
            const previousPath = absolutePath;
            absolutePath = await resolver(absolutePath);
            if (absolutePath !== previousPath) {
                break;
            }
        }
    }

    return absolutePath;
}
