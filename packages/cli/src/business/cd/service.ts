import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { sql } from '@cli-tools/shared';
import { logger } from '@/utils/logger';
import clipboard from 'clipboardy';
import { isWin } from '@cli-tools/shared';
import { ask, select, multiSelect } from '@/utils/inquirer';
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

    // 别名模式
    if (options?.alias) {
        await setAlias();
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
                    const aliasInfo = item.alias ? ` (别名: ${item.alias})` : '';
                    return `  [${index + 1}] ${item.path} (访问次数: ${item.count})${aliasInfo}`;
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

    const selectedPaths = await multiSelect(
        '请选择要删除的目录',
        history.map((item) => ({
            name: `${item.path} (访问次数: ${item.count})`,
            value: item.path,
        })),
    );

    if (!selectedPaths.length) {
        logger.info('未选择任何目录，操作已取消');
        return;
    }

    await sql((data) => {
        data.cdHistory = (data.cdHistory || []).filter((item: CdHistoryItem) => !selectedPaths.includes(item.path));
    });

    logger.success(`已删除 ${selectedPaths.length} 条历史记录`);
}

async function setAlias(): Promise<void> {
    const history: CdHistoryItem[] = await sql((data) => data.cdHistory || []);

    if (history.length === 0) {
        logger.info('当前无目录跳转历史记录');
        return;
    }

    const selectedPath = await select(
        '请选择要设置别名的目录',
        history.map((item) => ({
            name: item.alias ? `${item.path} (别名: ${item.alias})` : item.path,
            value: item.path,
        })),
    );

    if (!selectedPath) {
        logger.info('未选择目录，操作已取消');
        return;
    }

    const alias = await ask('请输入别名');
    if (!alias || !alias.trim()) {
        logger.error('别名不能为空');
        return;
    }
    if (alias.includes(' ')) {
        logger.error('别名不能包含空格');
        return;
    }
    // 检查别名是否已被其他目录使用
    const existing = history.find((item) => item.alias === alias.trim() && item.path !== selectedPath);
    if (existing) {
        logger.error(`别名已被 "${existing.path}" 使用`);
        return;
    }

    await sql((data) => {
        const item = data.cdHistory?.find((item: CdHistoryItem) => item.path === selectedPath);
        if (item) {
            item.alias = alias.trim();
        }
    });

    logger.success(`已为 "${selectedPath}" 设置别名: ${alias.trim()}`);
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
    } else {
        logger.warn(`非 Windows 系统，不支持直接跳转到${path.basename(absolutePath)}目录,已经将命令复制进剪贴板`);
        clipboard.writeSync(`cd ${absolutePath}`);
    }
}
