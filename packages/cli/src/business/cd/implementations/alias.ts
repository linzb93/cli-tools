import { sql } from '@cli-tools/shared/node';
import { logger } from '@/utils/logger';
import { ask, select } from '@/utils/readline';
import type { CdHistoryItem } from '../types';

export async function setAlias(): Promise<void> {
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
