/**
 * 将 cookie 字符串解析为对象
 * @param cookies cookie字符串
 * @returns cookie对象
 */
export const parseCookie = (cookies: string): Record<string, string | undefined> => {
    if (!cookies.trim()) {
        return {};
    }
    const list = cookies.split(';');
    return list.reduce((acc: Record<string, string | undefined>, item: string) => {
        const seg = item.split('=');
        const key = seg[0].trim();
        const value = seg.length > 1 ? (seg[1] ? seg[1].trim() : '') : undefined;
        return { ...acc, [key]: value };
    }, {});
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
