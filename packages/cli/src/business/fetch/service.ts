import { readFromClipboard, isHttpRequest, isTcpAddress } from './utils';
import { httpRequest } from './http';
import { tcpRequest } from './tcp';
import type { FetchOptions } from './types';
import { logger } from '@/utils/logger';

/**
 * 执行 fetch 请求
 * @param options fetch 选项
 */
export async function fetchService(options: FetchOptions): Promise<void> {
    const { url, data: dataFromArg, clipboard, method = 'post' } = options;

    let data: string | undefined;
    if (clipboard) {
        data = readFromClipboard();
    } else if (dataFromArg) {
        data = dataFromArg;
    }

    try {
        let result: unknown;
        if (isHttpRequest(url)) {
            result = await httpRequest(url, data, method);
        } else if (isTcpAddress(url)) {
            result = await tcpRequest(url, data);
        } else {
            logger.error('无效的地址格式，请使用 http://host:port/path 或 host:port');
            return;
        }
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        logger.error((error as Error).message);
    }
}
