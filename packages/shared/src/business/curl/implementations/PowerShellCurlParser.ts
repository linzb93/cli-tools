import { Options, CurlParser } from '../types';

/**
 * PowerShell模式解析器
 */
export const createPowerShellCurlParser = (options: Options): CurlParser => {
    const parseUrl = (line: string): string => {
        // 匹配 -Uri "..." 格式
        // 处理可能存在的反引号转义和空格
        const match = line.match(/-Uri\s+"([^"]+)"/i);
        if (match) {
            let url = match[1];
            // 清理可能存在的反引号和首尾空格
            // 用户示例中出现了 " `https://...` " 这种情况
            return url.replace(/`/g, '').trim();
        }
        return '';
    };

    const parseHeaders = (lines: string[]): Record<string, string> => {
        const headers: Record<string, string> = {};
        let inHeadersBlock = false;

        // 允许的header keys (参考BashCurlParser)
        const extra = options?.extra || '';
        const allowedHeaders = ['content-type', 'cookie', 'token', 'referer', 'user-agent'].concat(
            extra
                .split(',')
                .filter((item) => !!item)
                .map((item) => item.trim().toLowerCase()),
        );

        for (const line of lines) {
            const trimmed = line.trim();

            // 解析 $session.UserAgent
            if (trimmed.startsWith('$session.UserAgent')) {
                const match = trimmed.match(/=\s*"([^"]+)"/);
                if (match) {
                    headers['User-Agent'] = match[1];
                }
                continue;
            }

            // 进入 headers 块
            if (trimmed.includes('-Headers @{')) {
                inHeadersBlock = true;
                continue;
            }

            // 退出 headers 块
            if (inHeadersBlock && trimmed.startsWith('}')) {
                inHeadersBlock = false;
                continue;
            }

            if (inHeadersBlock) {
                // 解析 "key"="value"
                // 注意：PowerShell哈希表中key通常有引号，但有时也可能没有
                const match = trimmed.match(/"?([^"=]+)"?\s*=\s*"([^"]+)"/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2];

                    if (options?.full || allowedHeaders.includes(key.toLowerCase())) {
                        headers[key] = value;
                    }
                }
            }
        }
        return headers;
    };

    const parseData = (lines: string[], contentType: string): string => {
        for (const line of lines) {
            // 匹配 -Body "..."
            const match = line.trim().match(/-Body\s+"(.*)"$/);
            // 注意：这里用 .* 贪婪匹配到行尾，假设Body在同一行且以"结尾
            // 如果Body包含反引号转义的引号 `"
            if (match) {
                let body = match[1];
                // 处理PowerShell转义字符：`" 转换为 "
                body = body.replace(/`"/g, '"');
                // 如果最后有一个 " ` (因为正则可能匹配过多)，需要小心
                // 简单处理：如果以 ` 结尾，去掉
                if (body.endsWith('`')) {
                    body = body.slice(0, -1).trim();
                }
                return body;
            }
        }
        return '';
    };

    const getCookieFromCurl = (curlText: string): string => {
        // PowerShell通常使用WebSession管理cookie，这里尝试从Headers中提取Cookie
        // 或者从 $session 中提取（如果代码中有体现）
        // 目前实现只从Headers解析中获取，这里返回空，由parseHeaders处理Cookie字段
        return '';
    };

    const parseMethod = (lines: string[]): string => {
        for (const line of lines) {
            const match = line.trim().match(/-Method\s+"([^"]+)"/i);
            if (match) {
                return match[1].toLowerCase();
            }
        }
        return 'get';
    };

    return {
        parseUrl,
        parseHeaders,
        parseData,
        getCookieFromCurl,
        parseMethod,
    };
};
