import fs from 'node:fs';
import { sql } from '@cli-tools/shared/node';
import { logger } from '@/utils/logger';
import type { Options } from './types';
import { resolveTargetPath } from './helpers/resolve';
import { updateHistoryAndPrint, updateHistoryOnly, jump } from './helpers/history';
import { deleteHistory } from './implementations/delete';
import { setAlias } from './implementations/alias';
import { recursiveBrowse } from './implementations/recursive';

/**
 * cd 命令服务
 * @param targetPath - 目标路径
 * @param options - cd 命令选项
 */
export async function cdService(targetPath?: string, options?: Options) {
    if (options?.delete) {
        await deleteHistory();
        return;
    }

    if (options?.alias) {
        await setAlias();
        return;
    }

    if (options?.recursive) {
        const startPath = targetPath ? await resolveTargetPath(targetPath, options) : process.cwd();
        if (!startPath || !fs.existsSync(startPath) || !fs.statSync(startPath).isDirectory()) {
            logger.error(`错误: 路径不存在或不是一个目录 -> ${startPath}`, true);
            return;
        }
        await recursiveBrowse(startPath);
        return;
    }
    if (options?.prev) {
        const prevPath = await sql((data) => data.lastCdPath || '');
        if (!prevPath) {
            return;
        }
        await jump(prevPath);
        return;
    }

    if (targetPath) {
        const absolutePath = await resolveTargetPath(targetPath, options);

        if (!absolutePath || !fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
            logger.error(`错误: 路径不存在或不是一个目录 -> ${absolutePath}`, true);
            return;
        }

        if (targetPath === '.') {
            await updateHistoryOnly(absolutePath);
            logger.success(`已将当前目录存入数据库: ${absolutePath}`);
        } else {
            await updateHistoryAndPrint(absolutePath);
        }
    } else {
        const history = await sql((data) => data.cdHistory || []);
        if (history.length === 0) {
            logger.error('当前无目录跳转历史记录', true);
        }

        const topHistory = [...history].sort((a, b) => b.count - a.count).slice(0, 10);

        logger.info(
            `请使用 'mycli cd <序号>' 跳转到以下历史目录:\n${topHistory
                .map((item, index) => {
                    const aliasInfo = item.alias ? ` (别名: ${item.alias})` : '';
                    return `  [${index + 1}] ${item.path} (访问次数: ${item.count})${aliasInfo}`;
                })
                .join('\n')}`,
        );
    }
}
