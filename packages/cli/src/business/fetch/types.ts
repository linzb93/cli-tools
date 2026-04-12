export interface FetchOptions {
    url: string;
    data?: string;
    clipboard?: boolean;
    method?: 'post' | 'get';
}

/**
 * 判断 data 是否只包含 headers 和 data 两个属性
 */
export function isHeadersAndData(obj: unknown): obj is { headers: Record<string, string>; data: unknown } {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }
    const keys = Object.keys(obj);
    return keys.length === 2 && keys.includes('headers') && keys.includes('data');
}
