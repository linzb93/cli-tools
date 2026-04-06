import type { Options } from './types';
import { isCurl, getCookieFromCurl } from '../curl/shared';
import { parseCookie, stringifyCookie } from './shared';

export { parseCookie, stringifyCookie };

export const cookieService = async (data: string, options: Options): Promise<void> => {
    let realData = data;

    // 检查输入数据是否是curl命令
    if (typeof data === 'string' && isCurl(data)) {
        realData = getCookieFromCurl(data);
    }

    const objs = parseCookie(realData);
    let result = options.type === 'key' ? Object.keys(objs) : objs;
    console.log(result);
};
