import { isCurl, getCookieFromCurl } from '../curl';
import { Options } from './types';

export const parseCookie = (cookies: string) => {
    if (!cookies.trim()) {
        return {};
    }
    const list = cookies.split(';');
    const objs = list.reduce((acc: any, item: string) => {
        const seg = item.split('=');
        const key = seg[0].trim();
        // 如果没有等号，返回undefined；如果有等号但值为空，返回空字符串
        const value = seg.length > 1 ? (seg[1] ? seg[1].trim() : '') : undefined;
        return {
            ...acc,
            [key]: value,
        };
    }, {});
    return objs;
};

/**
 * 将对象转换为 cookie 字符串
 * @param cookieObj Cookie 对象
 * @returns Cookie 字符串
 */
export const stringifyCookie = (cookieObj: Record<string, string | undefined>): string => {
    return Object.entries(cookieObj)
        .map(([key, value]) => {
            if (value === undefined) {
                return key;
            }
            return `${key}=${value}`;
        })
        .join('; ');
};

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
