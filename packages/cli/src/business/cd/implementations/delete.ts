import { sql } from '@cli-tools/shared/node';
import { logger } from '@/utils/logger';
import { multiSelect } from '@/utils/readline';
import type { CdHistoryItem, CdSchema } from '../types';

export async function deleteHistory(): Promise<void> {
    const history: CdHistoryItem[] = await sql<CdHistoryItem[], CdSchema>((data) => data.cdHistory || []);

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

    await sql<void, CdSchema>((data) => {
        data.cdHistory = (data.cdHistory || []).filter((item: CdHistoryItem) => !selectedPaths.includes(item.path));
    });

    logger.success(`已删除 ${selectedPaths.length} 条历史记录`);
}
