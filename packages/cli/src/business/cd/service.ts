import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { sql } from '@cli-tools/shared';
import { logger } from '@/utils/logger';
import clipboard from 'clipboardy';
import { isWin } from '@cli-tools/shared';
import inquirer from '@/utils/inquirer';
import { Options, CdHistoryItem } from './types';
import { resolveTargetPath } from './helpers/resolve';

/**
 * cd 命令服务
 * @param targetPath - 目标路径
 * @param options - cd 命令选项
 */
export async function cdService(targetPath?: string, options?: Options) {
    // 删除模式
    if (options?.delete) {
        await deleteHistory();
        return;
    }

    if (targetPath) {
        const absolutePath = await resolveTargetPath(targetPath, options);

        // Check if valid directory
        if (!absolutePath || !fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
            logger.error(`错误: 路径不存在或不是一个目录 -> ${absolutePath}`, true);
        }

        // Update database and print
        await updateHistoryAndPrint(absolutePath);
    } else {
        // No path provided, show index list
        const history = await sql((data) => data.cdHistory || []);
        if (history.length === 0) {
            logger.error('当前无目录跳转历史记录', true);
        }

        // Sort by count descending and take top 10
        const topHistory = [...history].sort((a, b) => b.count - a.count).slice(0, 10);

        logger.info(
            `请使用 'mycli cd <序号>' 跳转到以下历史目录:\n${topHistory
                .map((item, index) => {
                    return `  [${index + 1}] ${item.path} (访问次数: ${item.count})`;
                })
                .join('\n')}`,
        );
    }
}

async function deleteHistory(): Promise<void> {
    const history: CdHistoryItem[] = await sql((data) => data.cdHistory || []);

    if (history.length === 0) {
        logger.info('当前无目录跳转历史记录');
        return;
    }

    const { selectedPaths } = await inquirer.prompt({
        type: 'checkbox',
        name: 'selectedPaths',
        message: '请选择要删除的目录',
        choices: history.map((item) => ({
            name: `${item.path} (访问次数: ${item.count})`,
            value: item.path,
        })),
    });

    if (!selectedPaths.length) {
        logger.info('未选择任何目录，操作已取消');
        return;
    }

    await sql((data) => {
        data.cdHistory = (data.cdHistory || []).filter((item: CdHistoryItem) => !selectedPaths.includes(item.path));
    });

    logger.success(`已删除 ${selectedPaths.length} 条历史记录`);
}

async function updateHistoryAndPrint(absolutePath: string) {
    await sql((data) => {
        if (!data.cdHistory) {
            data.cdHistory = [];
        }

        const existing = data.cdHistory.find((item) => item.path === absolutePath);
        if (existing) {
            existing.count += 1;
        } else {
            data.cdHistory.push({
                path: absolutePath,
                count: 1,
            });
        }
        // returning undefined will automatically trigger db.write() in operateJsonDatabase
    });

    if (isWin) {
        // Write the target path to a temporary file for the shell wrapper to read
        const tempFile = path.join(os.tmpdir(), '.mycli_cd_path');
        fs.writeFileSync(tempFile, absolutePath, 'utf8');

        // Also output to stdout for visibility
        logger.info(`准备跳转到: ${absolutePath}`);
    } else {
        logger.warn(`非 Windows 系统，不支持直接跳转到${path.basename(absolutePath)}目录,已经将命令复制进剪贴板`);
        clipboard.writeSync(`cd ${absolutePath}`);
    }
}
