import BaseCommand from '../BaseCommand';
import clipboardy from 'clipboardy';
import { InternalAxiosRequestConfig } from 'axios';
import CookieService from '../cookie';
import * as prettier from 'prettier';
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
