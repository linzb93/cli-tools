import fsp from 'node:fs/promises';
import Table from 'cli-table3';
import pMap from 'p-map';
import pReduce from 'p-reduce';
import { sql } from '@cli-tools/shared';
import { logger } from '@/utils/logger';
import progress from '@/utils/progress';

/**
 * 目录信息
 */
export interface DirInfo {
    /** 子目录名 */
    dir: string;
    /** 父目录路径 */
    prefix: string;
}

/**
 * 扫描目录并返回所有子目录信息
 * @returns 所有子目录信息列表
 */
export const expandWorkDirs = async (): Promise<DirInfo[]> => {
    const workDirs = await sql(async (db) => db.workDirs);

    if (!workDirs || workDirs.length === 0) {
        return [];
    }

    const allDirs = await pReduce(
        workDirs,
        async (acc, dir) => {
            try {
                const dirs = await fsp.readdir(dir.path);
                return acc.concat(
                    await pMap(
                        dirs,
                        async (subDir) => ({
                            dir: subDir,
                            prefix: dir.path,
                        }),
                        { concurrency: 4 },
                    ),
                );
            } catch {
                return acc;
            }
        },
        [] as DirInfo[],
    );

    return allDirs;
};

/**
 * 通用扫描器 - 并发扫描目录
 * @param allDirs - 目录信息列表
 * @param scanner - 单个目录的扫描函数
 * @param options - 配置选项
 * @param options.onError - 错误处理函数
 * @returns 扫描结果列表
 */
export const scanDirs = async <T>(
    allDirs: DirInfo[],
    scanner: (dirInfo: DirInfo) => Promise<T | null>,
    options?: { onError?: (error: unknown) => void },
): Promise<T[]> => {
    progress.setTotal(allDirs.length);

    const results = await pMap(
        allDirs,
        async (dirInfo) => {
            progress.tick();
            try {
                return await scanner(dirInfo);
            } catch (error) {
                options?.onError?.(error);
                return null;
            }
        },
        { concurrency: 4 },
    );

    logger.backwardConsole(2);

    // 过滤掉 null 结果
    return (results as (T | null)[]).filter((r): r is T => r !== null);
};

/**
 * 打印结果表格
 * @param list - 结果列表
 * @param columns - 列配置
 */
export const printResultTable = <T extends Record<string, any>>(
    list: T[],
    columns: {
        /** 列标题 */
        head: string[];
        /** 行数据映射函数 */
        map: (item: T, index: number) => string[];
    },
) => {
    const { head, map } = columns;
    const table = new Table({
        head,
        colAligns: head.map(() => 'left'),
    });

    table.push(...list.map((item, index) => map(item, index)));
    console.log(table.toString());
};
