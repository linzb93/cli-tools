import { expandWorkDirs } from '@/utils/scan';
import { logger } from '@/utils/logger';
import { doScan, printTable } from './helpers/scanner';
import { startRepl } from './helpers/commands';
import { Options } from './types';

/**
 * 扫描Git项目服务
 * @param {Options} [options] - 选项
 */
export const scanService = async (options: Options = {}) => {
    logger.clearConsole();
    logger.empty(2);
    const allDirs = await expandWorkDirs();
    const list = await doScan(allDirs, options);

    if (list.length === 0) {
        logger.success('恭喜！没有项目需要提交或推送。');
        return;
    }
    printTable(list, options);
    startRepl(list, options);
};
