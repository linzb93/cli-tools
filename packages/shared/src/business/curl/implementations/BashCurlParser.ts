import * as querystring from 'node:querystring';
import { BaseCurlParser } from '../BaseCurlParser';

/**
 * Bash模式curl解析器
 */
export class BashCurlParser extends BaseCurlParser {
    parseUrl(line: string): string {
        const match = line.match(/'([^']+)'/);
        return match ? match[1] : '';
    }

    parseHeaders(lines: string[]): Record<string, string> {
        // 只保留特定的请求头
        const extra = this.options?.extra || '';
        const allowedHeaders = ['content-type', 'cookie', 'token', 'referer', 'user-agent'].concat(
            extra
                .split(',')
                .filter((item) => !!item)
                .map((item) => item.trim().toLowerCase()),
        );

        const output = lines
            .filter((line) => {
                return line.trim().startsWith('-H');
            })
            .map((line) => line.trim())
            .reduce((acc, line) => {
                const keyMatch = line.match(/^\-H\s\$?\'([^:]+)/);
                if (!keyMatch) {
                    return acc;
                }

                const key = keyMatch[1].trim();
                if (!this.options?.full && !allowedHeaders.includes(key.toLowerCase())) {
                    return acc;
                }

                const valueMatch = line.match(/:\s*(.*?)\'\s*\\$/);
                if (!valueMatch) {
                    return acc;
                }

                let value = valueMatch[1].trim().replace(/\^\"\s\^$/, '');

                // 处理bash模式中的$'...'转义字符
                if (value.startsWith("$'")) {
                    value = value.slice(2);
                }

                acc[key] = value;
                return acc;
            }, {} as Record<string, string>);

        const cookie = this.getCookieFromCurl(lines.join('\n'));
        if (cookie) {
            output['Cookie'] = cookie;
        }

        return output;
    }

    parseData(lines: string[], contentType: string): string {
        const dataLine = lines.find(
            (line) =>
                line.trim().startsWith('--data-raw') ||
                line.trim().startsWith('--data') ||
                line.trim().startsWith('-d'),
        );
        if (!dataLine) {
            return '';
        }

        // 处理bash模式：--data-raw 'data'
        const match = dataLine.match(/--data-raw\s+'([^']*)'$/);
        const data = match ? match[1] : '';

        // 如果是application/x-www-form-urlencoded格式，转换为form-data
        if (contentType === 'application/x-www-form-urlencoded' && data) {
            return JSON.stringify(querystring.parse(data));
        }

        return data || '';
    }

    getCookieFromCurl(curlText: string): string {
        const lines = curlText.split('\n');

        // 查找cookie行，支持多种格式：-b, --cookie, -H 'Cookie:'
        const cookieLine = lines.find((line) => {
            const trimmed = line.trim();
            return trimmed.startsWith('-b ') || trimmed.startsWith('--cookie ') || trimmed.includes('Cookie:');
        });

        if (!cookieLine) {
            return '';
        }

        let cookieValue = '';

        // 处理 -b 或 --cookie 格式
        if (cookieLine.trim().startsWith('-b ') || cookieLine.trim().startsWith('--cookie ')) {
            const match = cookieLine.trim().match(/(?:-b|--cookie)\s+(.+)\'\s\\$/);
            if (match) {
                cookieValue = match[1];
            }
        }
        // 处理 -H 'Cookie:' 格式
        else if (cookieLine.includes('Cookie:')) {
            const match = cookieLine.match(/Cookie:\s*([^'"`]*)/);
            if (match) {
                cookieValue = match[1].trim();
            }
        }

        // 处理bash模式中的$'...'转义字符
        if (cookieValue.startsWith("$'")) {
            cookieValue = cookieValue.slice(2);
        }

        return cookieValue;
    }
}
