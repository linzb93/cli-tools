import BaseCommand from '../BaseCommand';
import clipboardy from 'clipboardy';
import { InternalAxiosRequestConfig } from 'axios';
import CookieService from '../cookie';
import * as prettier from 'prettier';

/**
 * cURL(cmd) 和 cURL(bash) 的区别
 * 1. cURL(cmd) 用的是双引号，而 cURL(bash) 用的是单引号
 * 2. cURL(cmd) 每行头尾的双引号前面会加上"^"符号，结尾用"^"换行，而 cURL(bash) 每行结尾用"\^"换行。如下：
 * cmd => -H ^"accept-language: zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7,zh-TW;q=0.6^" ^
 * bash => -H 'accept-language: zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7,zh-TW;q=0.6' \
 * 3. cURL(cmd) 开闭花括号前面有"^"符号，中间的双引号要用"^\^""表示。如下：
 * cmd => --data-raw ^"^{^\^"types^\^":^[2,3^]^}^"
 * bash => --data-raw '{"types":[2,3]}'
 * 4. cURL(bash) 会把特殊字符转成unicode字符，所以要用"unescape"方法把它转回来。如果有用到转义unicode字符，需要在字符前面加上"$"符号。如下：
 * -b $'uuid=a0c9b184cef8b742ffbe.1762825766.1.0.0;' \
 * 其中，"-b"是cookie的表示，有时也会看到：
 * * --cookie（-b 的完整形式）
 * * -H 'Cookie: ...'（在请求头中直接设置）
 */
export interface Options {
    format: string;
}

export default class CurlCommand extends BaseCommand {
    main(): void {
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
        let useCookieFormatterFunction = false;
        const url = urlLine.match(/"([^"]+)"/)[1].replace(/\^/g, '');
        const headers = lines
            .filter((line) => {
                return line.trim().startsWith('-H');
            })
            .reduce((acc, line) => {
                const [key, value] = line
                    .trim()
                    .replace(/^\-H \^\"/, '')
                    .replace(/\^\" \^$/, '')
                    .split(': ');
                // if (!['token', 'referer', 'content-type', 'cookie'].includes(key.trim().toLowerCase())) {
                //     return acc;
                // }
                if (key.trim() === 'cookie') {
                    useCookieFormatterFunction = true;
                    acc[key.trim()] = `cookieFormatter(${JSON.stringify(
                        new CookieService().parseCookie(value.trim())
                    )}})`;
                } else {
                    acc[key.trim()] = value.trim();
                }
                return acc;
            }, {});
        const data = lines
            .find((line) => {
                return line.trim().startsWith('--data-raw');
            })
            .trim()
            .replace('--data-raw', '')
            .trim()
            .replace(/^\^\"\^/, '')
            .replace(/\^\\\^/g, '')
            .replace(/\^\}\^\"$/, '}');
        const method = 'post';
        const cookieFormatterFunction = `
        function cookieFormatter(cookieObj) {
            return Object.keys(cookieObj).map(key => \`\${key}=\${cookieObj[key]}\`).join('; ');
        }`;
        let result = `import axios from 'axios';
(async () => {
${useCookieFormatterFunction ? cookieFormatterFunction : ''}
    try {
        const res = await axios({
            method: '${method}',
            url: '${url}',
            headers: ${prettier.format(JSON.stringify(headers), { parser: 'json' })},
            data: ${data},
        });
        console.log(res.data);
    } catch(e) {
        console.log(e.message);
    }
})()`;
        clipboardy.writeSync(result);
        this.logger.success('生成成功');
    }
    private getCurl(log = console.log) {
        return function (config: InternalAxiosRequestConfig) {
            const { headers } = config;
            const curl = `curl '${config.baseURL || ''}${config.url}' \
    -H 'accept: ${headers.Accept}' \
    -H 'content-type: application/json' \
    -H 'token: ${headers.token}' \
    --data-raw '${JSON.stringify(config.data)}'`;
            log(curl);
            return config;
        };
    }
}
