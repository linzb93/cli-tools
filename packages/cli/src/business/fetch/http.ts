import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { parseData } from './utils';
import { isHeadersAndData } from './types';

/**
 * 发送 HTTP 请求
 * @param url 请求地址
 * @param data 请求数据
 * @param method 请求方法
 * @returns 响应数据
 */
export async function httpRequest(url: string, data?: string, method: 'post' | 'get' = 'post'): Promise<unknown> {
    let headers: Record<string, string> = {};
    let body: unknown = undefined;

    if (data) {
        const parsed = parseData(data);
        if (isHeadersAndData(parsed)) {
            headers = parsed.headers;
            body = parsed.data;
        } else {
            body = parsed;
        }
    }

    const config: AxiosRequestConfig = {
        method,
        url,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
    };

    if (method === 'post' && body !== undefined) {
        config.data = body;
    } else if (method === 'get' && body !== undefined) {
        config.params = body;
    }

    const response = await axios(config);
    return response.data;
}
