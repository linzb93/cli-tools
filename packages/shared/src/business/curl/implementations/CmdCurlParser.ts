import * as querystring from 'node:querystring';
import { BaseCurlParser } from '../core/BaseCurlParser';

/**
 * CMD模式curl解析器
 */
export class CmdCurlParser extends BaseCurlParser {
    parseUrl(line: string): string {
        // 处理cmd模式：curl ^"url^" 或 curl ^"url^" [其他参数]
        const match = line.match(/^\s*curl\s+\^"([^"]+)\"\s*/);
        return match ? match[1].replace(/\^/g, '') : '';
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
                const keyMatch = line.match(/^\-H\s\^"([^:]+)/);
                if (!keyMatch) {
                    return acc;
                }

                const key = keyMatch[1].trim();
                if (!this.options?.full && !allowedHeaders.includes(key.toLowerCase())) {
                    return acc;
                }

                const valueMatch = line.match(/:\s*(.*?)\s*$/);
                if (!valueMatch) {
                    return acc;
                }

                const value = valueMatch[1]
                    .trim()
                    .replace(/\^\"\s\^$/, '')
                    .replace(/\^\\\^/g, '')
                    .replace(/\^\{/, '{')
                    .replace(/\^\}/, '}');

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
        const dataLine = lines.find((line) => {
            return (
                line.trim().startsWith('--data-raw') || line.trim().startsWith('--data') || line.trim().startsWith('-d')
            );
        });

        if (!dataLine) {
            return '';
        }

        const data = dataLine
            .trim()
            .replace(/^\-\-data-raw\s/, '')
            .replace(/^\^"/, '"')
            .replace(/\^"$/, '"')
            .replace(/\^\{/, '{')
            .replace(/\^\}/, '}')
            .replace(/\\\^/g, '')
            .replace(/\^"/g, '"')
            .replace(/"(.+)"/, '$1');

        // 如果是application/x-www-form-urlencoded格式，转换为form-data
        if (contentType === 'application/x-www-form-urlencoded' && data) {
            return JSON.stringify(querystring.parse(data.replace(/\^/g, '')));
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
            cookieValue = cookieLine
                .trim()
                .replace(/^-b\s\^"/, '')
                .replace(/\^"\s\^$/, '')
                .replace(/\^%\^/g, '%')
                .replace(/\^!/g, '');
        }
        // 处理 -H 'Cookie:' 格式
        else if (cookieLine.includes('Cookie:')) {
            const match = cookieLine.match(/Cookie:\s*([^'"`]*)/);
            if (match) {
                cookieValue = match[1].trim();
            }
        }

        return cookieValue;
    }
}
