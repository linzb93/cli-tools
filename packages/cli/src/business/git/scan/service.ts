import { expandWorkDirs } from '@/utils/scan';
import { logger } from '@/utils/logger';
import { doScan, printTable } from './scanner';
import { startRepl } from './commands';

/**
 * 扫描Git项目服务
 */
export const scanService = async () => {
    logger.clearConsole();
    logger.empty(2);
    const allDirs = await expandWorkDirs();
    const list = await doScan(allDirs);

    if (list.length === 0) {
        logger.success('恭喜！没有项目需要提交或推送。');
        return;
    }
    printTable(list);
    startRepl(list);
};
