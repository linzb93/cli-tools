import { join } from 'node:path';
import fsp from 'node:fs/promises';
import pMap from 'p-map';
import pReduce from 'p-reduce';
import { sql } from '@cli-tools/shared';
import { getGitProjectStatus, GitStatusMap } from '../shared/utils';
import type { Options, ResultItem, ScanCallbacks } from './types';

/**
 * 过滤需要处理的项目
 * @param items - 项目列表
 * @param full - 是否显示所有项目
 * @returns 过滤后的项目列表
 */
const filterProjects = (items: ResultItem[], full: boolean) => {
    const srcList = items.filter((item) =>
        [GitStatusMap.Uncommitted, GitStatusMap.Unpushed, GitStatusMap.NotOnMainBranch].includes(item.status),
    );
    return srcList.filter((item) => {
        if (full) return true;
        return item.status !== GitStatusMap.NotOnMainBranch;
    });
};

/**
 * 执行扫描并返回项目列表
 * @param options - 扫描选项
 * @param callbacks - 进度回调
 * @returns 项目列表
 */
const doScan = async (options: Options, callbacks?: ScanCallbacks): Promise<ResultItem[]> => {
    const { full } = options;

    const gitDirs = await sql(async (db) => db.gitDirs);
    const allDirs = await pReduce(
        gitDirs,
        async (acc, dir) => {
            try {
                const dirs = await fsp.readdir(dir.path);
                return acc.concat(
                    await pMap(
                        dirs,
                        async (subDir) => ({
                            dir: subDir,
                            prefix: dir.path,
                            folderName: dir.name,
                        }),
                        { concurrency: 4 },
                    ),
                );
            } catch (error) {
                // 如果目录不存在或无法读取，跳过
                return acc;
            }
        },
        [] as { dir: string; prefix: string; folderName: string }[],
    );

    callbacks?.onTotal?.(allDirs.length);

    let scannedCount = 0;
    const scannedList = await pMap(
        allDirs,
        async (dirInfo): Promise<ResultItem> => {
            const fullPath = join(dirInfo.prefix, dirInfo.dir);
            try {
                const { status, branchName } = await getGitProjectStatus(fullPath);
                scannedCount++;
                callbacks?.onProgress?.(scannedCount, allDirs.length);
                return {
                    path: fullPath,
                    status,
                    branchName,
                };
            } catch (error) {
                scannedCount++;
                callbacks?.onProgress?.(scannedCount, allDirs.length);
                // 如果获取状态失败，返回一个默认状态或者忽略
                return {
                    path: fullPath,
                    status: GitStatusMap.Pushed,
                    branchName: '',
                };
            }
        },
        { concurrency: 4 },
    );

    const filteredList = filterProjects(scannedList, full);
    callbacks?.onComplete?.(filteredList);
    return filteredList;
};

/**
 * 扫描Git项目服务
 * @param options - 扫描选项
 * @param callbacks - 进度回调
 */
export const scanService = async (options: Options, callbacks?: ScanCallbacks) => {
    await doScan(options, callbacks);
};
