import BaseCommand from '../BaseCommand';
import clipboardy from 'clipboardy';
import * as prettier from 'prettier';
import * as querystring from 'node:querystring';

export interface Options {
    extra?: string;
}

export default class CurlCommand extends BaseCommand {
    private options: Options;
    /**
     * 查询curl中的cookie并返回cookie字符串
     * @param curlText curl命令文本
     * @returns cookie字符串，如果没有找到则返回空字符串
     */
    public getCookieFromCurl(curlText: string, mode: 'cmd' | 'bash' = 'bash'): string {
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
            let match = null;
            if (mode === 'bash') {
                match = cookieLine.trim().match(/(?:-b|--cookie)\s+(.+)\'\s\\$/);
                if (match) {
                    cookieValue = match[1];
                }
            } else if (mode == 'cmd') {
                cookieValue = cookieLine
                    .trim()
                    .replace(/^-b\s\^"/, '')
                    .replace(/\^"\s\^$/, '')
                    .replace(/\^%\^/g, '%')
                    .replace(/\^!/g, '');
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

    /**
     * 检测curl命令是cmd模式还是bash模式
     * @param curlText curl命令文本
     * @returns 'cmd' 或 'bash'
     */
    private detectCurlMode(curlText: string): 'cmd' | 'bash' {
        // 检查是否包含cmd模式特有的^符号
        if (curlText.includes('^"') || curlText.includes('^"')) {
            return 'cmd';
        }
        // 检查是否包含bash模式特有的\换行符
        if (curlText.includes('\\\n') || curlText.includes("$'")) {
            return 'bash';
        }
        // 默认返回bash模式
        return 'bash';
    }

    /**
     * 解析curl命令中的URL
     * @param line 包含curl命令的行
     * @param mode curl模式
     * @returns 解析出的URL
     */
    private parseUrl(line: string, mode: 'cmd' | 'bash'): string {
        if (mode === 'cmd') {
            // 处理cmd模式：curl ^"url^" 或 curl ^"url^" [其他参数]
            const match = line.match(/^\s*curl\s+\^"([^"]+)\"\s*/);
            return match ? match[1].replace(/\^/g, '') : '';
        } else {
            const match = line.match(/'([^']+)'/);
            return match ? match[1] : '';
        }
    }

    /**
     * 解析curl命令中的请求头
     * @param lines curl命令的所有行
     * @param mode curl模式
     * @returns 请求头对象
     */
    private parseHeaders(lines: string[], mode: 'cmd' | 'bash'): Record<string, string> {
        // 只保留特定的请求头
        const allowedHeaders = ['content-type', 'cookie', 'token', 'referer', 'user-agent'].concat(
            this.options.extra
                .split(',')
                .filter((item) => !!item)
                .map((item) => item.trim().toLowerCase())
        );

        const output = lines
            .filter((line) => {
                return line.trim().startsWith('-H');
            })
            .map((line) => line.trim())
            .reduce((acc, line) => {
                let key = '';
                let value = '';

                if (mode === 'cmd') {
                    const keyMatch = line.match(/^\-H\s\^"([^:]+)/);
                    if (!keyMatch) {
                        return acc;
                    }
                    key = keyMatch[1].trim();
                    if (!allowedHeaders.includes(key.toLowerCase())) {
                        return acc;
                    }
                    const valueMatch = line.match(/:\s*(.*?)\s*$/);
                    if (!valueMatch) {
                        return acc;
                    }
                    value = valueMatch[1]
                        .trim()
                        .replace(/\^\"\s\^$/, '')
                        .replace(/\^\\\^/g, '')
                        .replace(/\^\{/, '{')
                        .replace(/\^\}/, '}');
                    acc[key] = value;
                } else {
                    const keyMatch = line.match(/^\-H\s\$?\'([^:]+)/);
                    if (!keyMatch) {
                        return acc;
                    }
                    key = keyMatch[1].trim();
                    if (!allowedHeaders.includes(key.toLowerCase())) {
                        return acc;
                    }
                    const valueMatch = line.match(/:\s*(.*?)\'\s*\\$/);
                    if (!valueMatch) {
                        return acc;
                    }
                    value = valueMatch[1].trim().replace(/\^\"\s\^$/, '');
                    acc[key] = value;
                }

                return acc;
            }, {} as Record<string, string>);
        if (this.getCookieFromCurl(lines.join('\n'), mode)) {
            output['Cookie'] = this.getCookieFromCurl(lines.join('\n'), mode);
        }
        return output;
    }

    /**
     * 解析curl命令中的请求体数据
     * @param lines curl命令的所有行
     * @param mode curl模式
     * @param contentType 内容类型
     * @returns 请求体数据
     */
    private parseData(lines: string[], mode: 'cmd' | 'bash', contentType: string): string {
        const dataLine = lines.find((line) => {
            return (
                line.trim().startsWith('--data-raw') || line.trim().startsWith('--data') || line.trim().startsWith('-d')
            );
        });

        if (!dataLine) {
            return '';
        }

        let data = '';

        if (mode === 'cmd') {
            data = dataLine
                .trim()
                .replace(/^\-\-data-raw\s/, '')
                .replace(/^\^"/, '"')
                .replace(/\^"$/, '"')
                .replace(/\^\{/, '{')
                .replace(/\^\}/, '}')
                .replace(/\\\^/g, '')
                .replace(/\^"/g, '"')
                .replace(/"(.+)"/, '$1');
        } else {
            // 处理bash模式：--data-raw 'data'
            const match = dataLine.match(/--data-raw\s+'([^']*)'$/);
            if (match) {
                data = match[1];
            }
        }

        // 如果是application/x-www-form-urlencoded格式，转换为form-data
        if (contentType === 'application/x-www-form-urlencoded' && data) {
            return JSON.stringify(querystring.parse(data.replace(/\^/g, '')));
        }

        return data || '';
    }

    /**
     * 解析curl命令中的HTTP方法
     * @param lines curl命令的所有行
     * @returns HTTP方法，默认为'get'
     */
    private parseMethod(lines: string[]): string {
        const methodLine = lines.find((line) => {
            return line.trim().startsWith('-X') || line.trim().startsWith('--request');
        });

        if (methodLine) {
            const match = methodLine.match(/-(?:X|\-request)\s+(\w+)/);
            return match ? match[1].toLowerCase() : 'get';
        }

        // 如果有数据体，默认为POST
        const hasData = lines.some((line) => {
            return (
                line.trim().startsWith('--data-raw') || line.trim().startsWith('--data') || line.trim().startsWith('-d')
            );
        });

        return hasData ? 'post' : 'get';
    }

    main(options: Options): void {
        this.options = options;

        // 读取剪贴板
        const curl = clipboardy.readSync();
        if (!curl) {
            this.logger.error('剪贴板为空');
            return;
        }
        const lines = curl.split('\n');
        const urlLine = lines.find((line) => {
            return line.trim().startsWith('curl');
        });
        if (!urlLine) {
            this.logger.error('可能剪贴板里的不是curl代码，退出进程');
            return;
        }

        // 检测curl模式
        const mode = this.detectCurlMode(curl);
        this.logger.info(`检测到curl模式: ${mode}`);

        // 解析各个部分
        const url = this.parseUrl(urlLine, mode);
        const headers = this.parseHeaders(lines, mode);
        const method = this.parseMethod(lines);
        const contentType = headers['content-type'] || headers['Content-Type'] || '';
        const data = this.parseData(lines, mode, contentType);

        if (!url) {
            this.logger.error('无法解析URL');
            return;
        }

        // 生成JavaScript代码
        let result = `import axios from 'axios';
`;

        // 如果是form-urlencoded，需要导入URLSearchParams
        if (contentType === 'application/x-www-form-urlencoded') {
            result += `
            import FormData from 'form-data';
            // 注意：此请求使用application/x-www-form-urlencoded格式\n`;
        }

        result += `(async () => {
        ${
            contentType === 'application/x-www-form-urlencoded'
                ? `
                const fd = new FormData();
                ${Object.keys(JSON.parse(data))
                    .map((key) => {
                        const value = JSON.parse(data)[key];
                        return `fd.append('${key}', '${value}');`;
                    })
                    .join('\n')}
            `
                : ''
        }
    try {
        const res = await axios({
            method: '${method}',
            url: '${url}',`;

        if (Object.keys(headers).length > 0) {
            result += `
            headers: ${JSON.stringify(headers)},`;
        }

        if (data) {
            result += `
            data: ${contentType === 'application/x-www-form-urlencoded' ? 'fd' : data},`;
        }

        result += `
        });
        console.log(res.data);
    } catch(e) {
        console.log(e.message);
    }
})()`;
        const output = prettier.format(result, { parser: 'typescript' });
        clipboardy.writeSync(output);
        this.logger.success('生成成功');
    }
}
