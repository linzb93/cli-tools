import { basename, join } from 'node:path';
import fsp from 'node:fs/promises';
import chalk from 'chalk';
import { expandWorkDirs, scanDirs, printResultTable } from '@/utils/scan';
import { logger } from '@/utils/logger';
import type { ScanResultItem } from './types';

/**
 * 判断版本是否锁定了（精确版本，无 ^ ~ >= 等前缀）
 * @param version - 版本字符串
 * @returns 是否锁定版本
 */
const isVersionLocked = (version: string): boolean => {
    // 锁定的版本：不含 ^ ~ >= > <= < 等前缀
    return !/^[\^~>=<]/.test(version);
};

/**
 * 提取版本号（去掉 ^ ~ >= > <= < 等前缀）
 * @param version - 版本字符串
 * @returns 纯版本号字符串
 */
const extractVersion = (version: string): string => {
    return version.replace(/^[\^~>=<]+/, '');
};

/**
 * 比较两个版本号的大小（按语义版本比较）
 * @param current - 当前版本
 * @param target - 目标版本
 * @returns current < target 返回 true
 */
const isVersionLower = (current: string, target: string): boolean => {
    const currentVer = extractVersion(current);
    const targetVer = extractVersion(target);

    const currentParts = currentVer.split('.').map(Number);
    const targetParts = targetVer.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, targetParts.length); i++) {
        const c = currentParts[i] || 0;
        const t = targetParts[i] || 0;
        if (c < t) return true;
        if (c > t) return false;
    }
    return false;
};

/**
 * 获取版本的主版本号
 * @param version - 版本字符串
 * @returns 主版本号数字
 */
const getMajorVersion = (version: string): number => {
    const ver = extractVersion(version);
    const major = parseInt(ver.split('.')[0], 10);
    return isNaN(major) ? 0 : major;
};

/**
 * 扫描单个项目的 npm 依赖
 * @param dirInfo - 目录信息
 * @param packageName - 要扫描的包名
 * @param targetVersions - 目标版本列表
 * @returns 扫描结果
 */
const scanProject = async (
    dirInfo: { dir: string; prefix: string },
    packageName: string,
    targetVersions?: string[],
): Promise<ScanResultItem | null> => {
    const fullPath = join(dirInfo.prefix, dirInfo.dir);
    try {
        const packageJsonPath = join(fullPath, 'package.json');
        const packageJsonContent = await fsp.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);

        const deps = packageJson.dependencies || {};
        const devDeps = packageJson.devDependencies || {};

        let dependencyType: 'dependencies' | 'devDependencies' | null = null;
        let currentVersion: string | null = null;

        if (deps[packageName]) {
            dependencyType = 'dependencies';
            currentVersion = deps[packageName];
        } else if (devDeps[packageName]) {
            dependencyType = 'devDependencies';
            currentVersion = devDeps[packageName];
        }

        // 如果没找到该包
        if (!currentVersion) {
            return null;
        }

        const isLocked = isVersionLocked(currentVersion);
        let status: 'problem' | 'found' | 'not-found' = 'found';

        // 如果没有传入目标版本，所有使用该包的项目都显示
        if (!targetVersions || targetVersions.length === 0) {
            status = 'found';
        } else {
            // 检查主版本号是否匹配
            const currentMajor = getMajorVersion(currentVersion!);
            const hasMatchingMajor = targetVersions.some((target) => getMajorVersion(target) === currentMajor);

            // 主版本号不匹配，不纳入问题范围
            if (!hasMatchingMajor) {
                status = 'not-found';
            } else {
                // 检查是否符合问题条件
                // 1. 没锁版本且低于传入版本
                // 2. 锁了版本但是正好是传入版本
                const isLower = targetVersions.some((target) => isVersionLower(currentVersion!, target));
                const isExactMatch = targetVersions.includes(currentVersion!);

                if ((!isLocked && isLower) || (isLocked && isExactMatch)) {
                    status = 'problem';
                } else {
                    status = 'found';
                }
            }
        }

        return {
            fullPath,
            projectName: basename(fullPath),
            dependencyType,
            currentVersion,
            isLocked,
            status,
        };
    } catch {
        return null;
    }
};

/**
 * 执行扫描
 * @param packageName - 要扫描的包名
 * @param targetVersions - 目标版本列表
 * @returns 扫描结果列表
 */
const doScan = async (packageName: string, targetVersions?: string[]): Promise<ScanResultItem[]> => {
    logger.info('开始扫描');
    const allDirs = await expandWorkDirs();

    if (allDirs.length === 0) {
        logger.error('未配置 npm 扫描目录，请在数据库中配置 workDirs');
        return [];
    }

    return scanDirs(allDirs, (dirInfo) => scanProject(dirInfo, packageName, targetVersions));
};

/**
 * npm scan 服务
 * @param packageName - 要扫描的包名（必填）
 * @param versionStr - 目标版本字符串，逗号分隔（可选）
 */
export const scanService = async (packageName: string, versionStr?: string) => {
    if (!packageName) {
        logger.error('请指定要扫描的包名（--package）');
        return;
    }

    // 解析目标版本
    const versions = versionStr
        ? versionStr
              .split(',')
              .map((v: string) => v.trim())
              .filter((v: string) => v)
        : undefined;

    const list = await doScan(packageName, versions);

    if (versions && versions.length > 0) {
        // 有目标版本时，只显示问题项目
        const problemList = list.filter((item) => item.status === 'problem');
        if (problemList.length === 0) {
            logger.success('恭喜！没有发现问题项目。');
            return;
        }

        // 按主版本号分组
        const groupedByMajor = new Map<number, ScanResultItem[]>();
        for (const item of problemList) {
            const major = getMajorVersion(item.currentVersion || '');
            if (!groupedByMajor.has(major)) {
                groupedByMajor.set(major, []);
            }
            groupedByMajor.get(major)!.push(item);
        }

        // 按主版本号排序输出，合并在一个 Table
        const sortedMajors = Array.from(groupedByMajor.keys()).sort((a, b) => a - b);
        const allItems: ScanResultItem[] = [];
        for (const major of sortedMajors) {
            const items = groupedByMajor.get(major)!;
            allItems.push(...items);
        }
        console.log(chalk.yellow(`\n发现 ${problemList.length} 个问题项目：\n`));
        printResultTable(allItems, {
            head: ['序号', '主版本', '路径', '当前版本'],
            map: (item, index) => [
                `${index + 1}`,
                `v${getMajorVersion(item.currentVersion || '')}`,
                item.fullPath,
                item.currentVersion || '-',
            ],
        });
    } else {
        // 没有目标版本时，显示所有使用该包的项目
        if (list.length === 0) {
            logger.info(`没有找到使用 ${packageName} 的项目。`);
            return;
        }
        console.log(chalk.blue(`\n找到 ${list.length} 个使用 ${packageName} 的项目：\n`));
        printResultTable(list, {
            head: ['序号', '路径', '当前版本'],
            map: (item, index) => [`${index + 1}`, item.fullPath, item.currentVersion || '-'],
        });
    }
};
