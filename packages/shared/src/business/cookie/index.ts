import { format } from 'prettier';
import BaseService from '../core/BaseService.abstract';
import { CurlService } from '../curl';

/**
 * Cookie 解析选项接口
 * @interface Options
 */
export interface Options {
    /**
     * 是否显示帮助信息
     * @default false
     */
    help?: boolean;

    /**
     * 解析类型：'key' 返回键名数组，'json' 返回键值对对象
     * @default 'json'
     */
    type: 'key' | 'json';
}

export class CookieService extends BaseService {
    /**
     * 解析 Cookie 字符串
     * @param {string} data Cookie 字符串
     * @param {Options} options 解析选项
     * @returns {Promise<void>}
     */
    async main(data: string, options: Options): Promise<void> {
        const curlUtil = new CurlService();
        let realData = data;

        // 检查输入数据是否是curl命令
        if (typeof data === 'string' && curlUtil.isCurl(data)) {
            realData = curlUtil.getCookieFromCurl(data);
        }

        const objs = this.parseCookie(realData);
        let result = options.type === 'key' ? Object.keys(objs) : objs;
        console.log(result);
    }
    parseCookie(cookies: string) {
        if (!cookies.trim()) {
            return {};
        }
        const list = cookies.split(';');
        const objs = list.reduce((acc, item) => {
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
    }
}
