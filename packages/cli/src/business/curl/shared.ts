import { createParser, detectCurlMode } from './core/Factory';
import type { Options } from './types';
import { logger } from '@/utils/logger';

/**
 * 判断字符串是否是 curl 命令
 * @param curl 可能为curl命令的字符串
 * @returns 是否为curl命令
 */
export const isCurl = (curl: string): boolean => {
    const trimmed = curl.trim();
    return (
        trimmed.startsWith('curl') ||
        trimmed.includes('Invoke-WebRequest') ||
        trimmed.includes('New-Object Microsoft.PowerShell')
    );
};

/**
 * 从 curl 命令中提取 cookie
 * @param curl curl命令文本
 * @param options 选项
 * @returns cookie字符串
 */
export const getCookieFromCurl = (curl: string, options?: Options): string => {
    const lines = curl.split('\n');
    const urlLine = lines.find((line) => {
        const trimmed = line.trim();
        return trimmed.startsWith('curl') || trimmed.startsWith('Invoke-WebRequest');
    });
    if (!urlLine) {
        logger.error('可能剪贴板里的不是curl代码，退出进程');
        process.exit(0);
    }
    const mode = detectCurlMode(curl);
    const parser = createParser(mode, options || ({} as Options));
    return parser.getCookieFromCurl(curl);
};

/**
 * 获取curl命令中的HTTP请求体
 * @param curl curl命令文本
 * @param options 选项
 * @returns 请求体数据，如果没有请求体则返回空字符串
 */
export const getBodyFromCurl = (curl: string, options?: Options): string => {
    if (!isCurl(curl)) {
        logger.error('不是有效的curl命令');
        return '';
    }

    const lines = curl.split('\n');
    const urlLine = lines.find((line) => {
        const trimmed = line.trim();
        return trimmed.startsWith('curl') || trimmed.startsWith('Invoke-WebRequest');
    });

    if (!urlLine) {
        logger.error('无法找到curl命令起始行');
        return '';
    }

    const mode = detectCurlMode(curl);
    const parser = createParser(mode, options || ({} as Options));

    const headers = parser.parseHeaders(lines);
    const contentType = headers['content-type'] || headers['Content-Type'] || '';

    return parser.parseData(lines, contentType);
};
