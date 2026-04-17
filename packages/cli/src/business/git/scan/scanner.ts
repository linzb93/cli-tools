import { printResultTable } from '@/utils/scan';
import { scanDirs } from '@/utils/scan';
import { getGitProjectStatus, GitStatusMap } from '../shared/utils';
import chalk from 'chalk';
import type { ResultItem } from './types';
import { basename } from 'node:path';
/**
 * 过滤需要处理的项目
 * @param items - 项目列表
 * @returns 过滤后的项目列表
 */
const filterProjects = (items: ResultItem[]): ResultItem[] => {
    const statusesToKeep = [GitStatusMap.Uncommitted, GitStatusMap.Unpushed];
    return items.filter((item) => statusesToKeep.includes(item.status));
};

/**
 * 执行全量扫描
 * @returns 扫描结果列表
 */
export const doScan = async (list: string[]): Promise<ResultItem[]> => {
    const scannedList = await scanDirs<ResultItem>(list, async (dirPath) => {
        const { status, branchName } = await getGitProjectStatus(dirPath);
        return {
            fullPath: dirPath,
            status,
            branchName,
        };
    });

    return filterProjects(scannedList);
};

/**
 * 重新扫描项目列表（并发）
 * @param list - 需要重新扫描的项目列表
 * @returns 重新扫描并过滤后的列表
 */
export const rescanProjects = async (list: string[]): Promise<ResultItem[]> => {
    return await doScan(list);
};

/**
 * 打印扫描结果表格
 * @param items - 扫描结果列表
 */
export const printTable = (items: ResultItem[]) => {
    printResultTable(items, {
        head: ['名称', '地址', '状态', '分支'],
        map: (item) => [
            `${basename(item.fullPath)}`,
            item.fullPath,
            item.status === 1 ? chalk.red('未提交') : item.status === 2 ? chalk.yellow('未推送') : chalk.green('正常'),
            item.branchName,
        ],
    });
};
