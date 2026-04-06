import clipboardy from 'clipboardy';
import * as prettier from 'prettier';
import { createParser, detectCurlMode } from './core/Factory';
import type { Options } from './types';
import { logger } from '@/utils/logger';
import { parseCookie } from '../cookie/shared';
import { isCurl, getCookieFromCurl, getBodyFromCurl } from './shared';

export type { Options };
export { isCurl, getCookieFromCurl, getBodyFromCurl };

export const curlService = async (options: Options): Promise<void> => {
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

    // 处理 Cookie
    let cookieFunctionCode = '';
    let cookieObjCode = '';
    let hasCookie = false;

    const cookieKey = Object.keys(headers).find((k) => k.toLowerCase() === 'cookie');
    if (cookieKey) {
        hasCookie = true;
        const cookieStr = headers[cookieKey];
        const cookieObj = parseCookie(cookieStr);
        delete headers[cookieKey];

        cookieFunctionCode = `
/**
 * 将对象转换为 cookie 字符串
 */
const stringifyCookie = (obj) => {
    return Object.entries(obj)
        .map(([key, value]) => {
            if (value === undefined) {
                return key;
            }
            return \`\${key}=\${value}\`;
        })
        .join('; ');
};
`;
        cookieObjCode = `
    const cookieObj = ${JSON.stringify(cookieObj, null, 4)};
`;
    }

    if (!url) {
        logger.error('无法解析URL');
        return;
    }

    // 生成JavaScript代码
    let result = `import axios from 'axios';
${cookieFunctionCode}
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
    ${hasCookie ? cookieObjCode : ''}
    try {
        const res = await axios({
            method: '${method}',
            url: '${url}',`;

    if (hasCookie || Object.keys(headers).length > 0) {
        result += `
            headers: {
                ${Object.keys(headers).length > 0 ? `...${JSON.stringify(headers)},` : ''}
                ${hasCookie ? 'Cookie: stringifyCookie(cookieObj)' : ''}
            },`;
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
    const output = await prettier.format(result, { parser: 'typescript' });
    clipboardy.writeSync(output);
    logger.success('生成成功');
};
