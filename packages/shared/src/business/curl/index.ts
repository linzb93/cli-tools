import clipboardy from 'clipboardy';
import * as prettier from 'prettier';
import { createParser, detectCurlMode } from './core/Factory';
import type { Options } from './types';
import { logger } from '../../utils/logger';

export type { Options };

export const isCurl = (curl: string): boolean => {
    const trimmed = curl.trim();
    return trimmed.startsWith('curl') || trimmed.includes('Invoke-WebRequest') || trimmed.includes('New-Object Microsoft.PowerShell');
};

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
    const parser = createParser(mode, options || {} as Options);
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
    const parser = createParser(mode, options || {} as Options);

    const headers = parser.parseHeaders(lines);
    const contentType = headers['content-type'] || headers['Content-Type'] || '';

    // 解析请求体数据
    return parser.parseData(lines, contentType);
};

export const curlService = (options: Options): void => {
    // 读取剪贴板
    const curl = clipboardy.readSync();
    if (!curl) {
        logger.error('剪贴板为空');
        return;
    }
    const lines = curl.split('\n');
    const urlLine = lines.find((line) => {
        const trimmed = line.trim();
        return trimmed.startsWith('curl') || trimmed.startsWith('Invoke-WebRequest');
    });
    if (!urlLine) {
        logger.error('可能剪贴板里的不是curl代码，退出进程');
        return;
    }

    // 检测curl模式
    const mode = detectCurlMode(curl);
    logger.info(`检测到curl模式: ${mode}`);

    // 创建对应的解析器
    const parser = createParser(mode, options);

    // 解析各个部分
    const url = parser.parseUrl(urlLine);
    const headers = parser.parseHeaders(lines);
    const method = parser.parseMethod(lines);
    const contentType = headers['content-type'] || headers['Content-Type'] || '';
    const data = parser.parseData(lines, contentType);

    if (!url) {
        logger.error('无法解析URL');
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
    logger.success('生成成功');
};
