import BaseCommand from '../BaseCommand';
import clipboardy from 'clipboardy';
import { InternalAxiosRequestConfig } from 'axios';
import CookieService from '../cookie';
import * as prettier from 'prettier';
export interface Options {
    format: string;
}

export default class CurlCommand extends BaseCommand {
    main(options: Options): void {
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
        let useCookieFormatterFunction = false;
        const url = urlLine.match(/'([^']+)'/)[1];
        const headers = lines
            .filter((line) => {
                return line.trim().startsWith('-H');
            })
            .reduce((acc, line) => {
                const [key, value] = line.replace(/' \\/, '').replace("-H '", '').split(':');
                if (!['token', 'referer', 'content-type', 'cookie'].includes(key.trim())) {
                    return acc;
                }
                if (key.trim() === 'cookie') {
                    useCookieFormatterFunction = true;
                    acc[key.trim()] = `cookieFormatter(${prettier.format(
                        JSON.stringify(new CookieService().parseCookie(value.trim())),
                        { parser: 'json' }
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
            .replace(/^\'/, '')
            .replace(/\'$/, '');
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
            data: ${prettier.format(data, { parser: 'json' })},
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
