import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { sql } from '@cli-tools/shared';
import { logger } from '@/utils/logger';
import clipboard from 'clipboardy';
import { isWin } from '@cli-tools/shared';
import inquirer from '@/utils/inquirer';
import { Options } from './types';

interface CdHistoryItem {
    path: string;
    count: number;
}

export async function cdService(targetPath?: string, options?: Options) {
    // 删除模式
    if (options?.delete) {
        await deleteHistory();
        return;
    }

    if (targetPath) {
        // 如果输入的是纯数字索引，尝试从历史记录中匹配
        if (/^\d+$/.test(targetPath)) {
            const index = parseInt(targetPath, 10) - 1;
            const history = await sql((data) => data.cdHistory || []);
            const topHistory = [...history].sort((a, b) => b.count - a.count).slice(0, 10);

            if (index >= 0 && index < topHistory.length) {
                targetPath = topHistory[index].path;
            } else {
                // 如果索引超出范围，我们不直接退出，而是尝试把它当作一个名为数字的目录
                // （这符合原生 cd 命令的回退机制）
            }
        }

        // Resolve absolute path
        let absolutePath = path.resolve(process.cwd(), targetPath);

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

        // Check if valid directory
        if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
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
