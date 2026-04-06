import { basename, join } from 'node:path';
import { expandWorkDirs, scanDirs, printResultTable } from '@/utils/scan';
import { logger } from '@/utils/logger';
import { getGitProjectStatus, GitStatusMap } from '../shared/utils';
import { startRepl } from './commands';
import type { ResultItem } from './types';

/**
 * 过滤需要处理的项目
 * @param {ResultItem[]} items - 项目列表
 * @returns {ResultItem[]} - 过滤后的项目列表
 */
const filterProjects = (items: ResultItem[]): ResultItem[] => {
    return items.filter((item) =>
        [GitStatusMap.Uncommitted, GitStatusMap.Unpushed, GitStatusMap.NotOnMainBranch].includes(item.status),
    );
};

/**
 * 执行扫描并返回项目列表
 * @returns {ResultItem[]} - 项目列表
 */
const doScan = async (): Promise<ResultItem[]> => {
    const allDirs = await expandWorkDirs();

    const scannedList = await scanDirs<ResultItem>(allDirs, async (dirInfo) => {
        const fullPath = join(dirInfo.prefix, dirInfo.dir);
        const { status, branchName } = await getGitProjectStatus(fullPath);
        return {
            fullPath,
            status,
            branchName,
        };
    });

    return filterProjects(scannedList);
};

/**
 * 扫描Git项目服务
 */
export const scanService = async () => {
    const list = await doScan();

    if (list.length === 0) {
        logger.success('恭喜！没有项目需要提交或推送。');
        return;
    }

    printResultTable(list, {
        head: ['名称', '地址', '状态', '分支'],
        map: (item, index) => [
            `${index + 1}. ${basename(item.fullPath)}`,
            item.fullPath,
            item.status === 1
                ? '\x1b[31m未提交\x1b[0m'
                : item.status === 2
                    ? '\x1b[33m未推送\x1b[0m'
                    : item.status === 3
                        ? '\x1b[32m正常\x1b[0m'
                        : '\x1b[90m不在主分支上\x1b[0m',
            item.branchName,
        ],
    });

    startRepl(list);
};
