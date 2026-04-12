import clipboardy from 'clipboardy';

/**
 * 从剪贴板读取内容
 * @returns 剪贴板内容
 */
export function readFromClipboard(): string {
    return clipboardy.readSync();
}

/**
 * 解析 JSON 数据
 * @param data JSON 字符串
 * @returns 解析后的对象
 */
export function parseData(data: string): unknown {
    try {
        return JSON.parse(data);
    } catch (error) {
        throw new Error(`JSON.parse 失败: ${(error as Error).message}`);
    }
}

/**
 * 判断是否是 HTTP 请求
 * @param url URL
 * @returns 是否是 HTTP 请求
 */
export function isHttpRequest(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * 判断是否是 TCP 地址（host:port 格式）
 * @param url URL
 * @returns 是否是 TCP 地址
 */
export function isTcpAddress(url: string): boolean {
    // 匹配 host:port 格式，如 localhost:3000, 127.0.0.1:8080
    return /^\S+:\d+$/.test(url);
}

/**
 * 解析 TCP 地址
 * @param url TCP 地址（host:port）
 * @returns host 和 port
 */
export function parseTcpAddress(url: string): { host: string; port: number } {
    const [host, port] = url.split(':');
    return { host, port: parseInt(port, 10) };
}
