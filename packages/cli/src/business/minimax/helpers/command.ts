import type { ReadlineCommand } from '@/utils/readline';
import { refresh } from './render';

export function createRefreshCommand(): ReadlineCommand {
    return {
        name: 'refresh',
        description: '立即刷新用量数据',
        handler: async () => {
            await refresh();
        },
    };
}
