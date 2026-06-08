import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { sql, isWin } from '@cli-tools/shared';
import { logger } from '@/utils/logger';
import clipboard from 'clipboardy';

export async function updateHistoryAndPrint(absolutePath: string) {
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
    });
    if (isWin) {
        if (process.env.MODE !== 'cliTest') {
            const tempFile = path.join(os.tmpdir(), '.mycli_cd_path');
            fs.writeFileSync(tempFile, absolutePath, 'utf8');
        } else {
            logger.info(`调试模式下，不触发目录跳转，已经将命令复制进剪贴板`);
            clipboard.writeSync(`cd ${absolutePath}`);
        }
    } else {
        logger.warn(`非 Windows 系统，不支持直接跳转到${path.basename(absolutePath)}目录,已经将命令复制进剪贴板`);
        clipboard.writeSync(`cd ${absolutePath}`);
    }
}

/**
 * 仅触发目录跳转，不更新历史记录
 */
export function navigateOnly(absolutePath: string) {
    if (isWin) {
        if (process.env.MODE !== 'cliTest') {
            const tempFile = path.join(os.tmpdir(), '.mycli_cd_path');
            fs.writeFileSync(tempFile, absolutePath, 'utf8');
        } else {
            logger.info(`调试模式下，不触发目录跳转，已经将命令复制进剪贴板`);
            clipboard.writeSync(`cd ${absolutePath}`);
        }
    } else {
        logger.warn(`非 Windows 系统，不支持直接跳转到${path.basename(absolutePath)}目录,已经将命令复制进剪贴板`);
        clipboard.writeSync(`cd ${absolutePath}`);
    }
}

/**
 * 仅更新历史记录，不触发目录跳转（不写临时文件/剪贴板）
 */
export async function updateHistoryOnly(absolutePath: string) {
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
    });
}
