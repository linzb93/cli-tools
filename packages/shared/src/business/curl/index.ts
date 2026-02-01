import { BaseService } from '../../base/BaseService';
import clipboardy from 'clipboardy';
import * as prettier from 'prettier';
import { CurlParserFactory } from './ModuleFactory';
import type { Options } from './types';

export type { Options };

export class CurlService extends BaseService {
    private options: Options;

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
        const mode = CurlParserFactory.detectCurlMode(curl);
        this.logger.info(`检测到curl模式: ${mode}`);

        // 创建对应的解析器
        const parser = CurlParserFactory.createParser(mode, options);

        // 解析各个部分
        const url = parser.parseUrl(urlLine);
        const headers = parser.parseHeaders(lines);
        const method = parser['parseMethod'](lines); // 调用基类的受保护方法
        const contentType = headers['content-type'] || headers['Content-Type'] || '';
        const data = parser.parseData(lines, contentType);

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
            ${contentType === 'application/x-www-form-urlencoded' ? `import FormData from 'form-data';` : ''} {}
            // 注意：此请求使用application/x-www-form-urlencoded格式\n`;
        }

        result += `(async () => {
        ${
            contentType === 'application/x-www-form-urlencoded' && !!data
                ? `const fd = new FormData();
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
    isCurl(curl: string): boolean {
        return curl.trim().startsWith('curl');
    }
    getCookieFromCurl(curl: string): string {
        const lines = curl.split('\n');
        const urlLine = lines.find((line) => {
            return line.trim().startsWith('curl');
        });
        if (!urlLine) {
            this.logger.error('可能剪贴板里的不是curl代码，退出进程');
            process.exit(0);
        }
        const parser = CurlParserFactory.createParser(CurlParserFactory.detectCurlMode(curl), this.options);
        return parser.getCookieFromCurl(curl);
    }

    /**
     * 获取curl命令中的HTTP请求体
     * @param curl curl命令文本
     * @returns 请求体数据，如果没有请求体则返回空字符串
     */
    getBodyFromCurl(curl: string): string {
        if (!this.isCurl(curl)) {
            this.logger.error('不是有效的curl命令');
            return '';
        }

        const lines = curl.split('\n');
        const urlLine = lines.find((line) => {
            return line.trim().startsWith('curl');
        });

        if (!urlLine) {
            this.logger.error('无法找到curl命令起始行');
            return '';
        }

        // 检测curl模式
        const mode = CurlParserFactory.detectCurlMode(curl);

        // 创建对应的解析器
        const parser = CurlParserFactory.createParser(mode, this.options);

        // 解析请求头以获取内容类型
        const headers = parser.parseHeaders(lines);
        const contentType = headers['content-type'] || headers['Content-Type'] || '';

        // 解析请求体数据
        return parser.parseData(lines, contentType);
    }
}
