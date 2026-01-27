import { Options } from './index';

/**
 * 抽象基类，定义curl解析器的通用接口
 */
export abstract class BaseCurlParser {
    protected options: Options;

    constructor(options: Options) {
        this.options = options;
    }

    /**
     * 解析curl命令中的URL
     * @param line 包含curl命令的行
     * @returns 解析出的URL
     */
    abstract parseUrl(line: string): string;

    /**
     * 解析curl命令中的请求头
     * @param lines curl命令的所有行
     * @returns 请求头对象
     */
    abstract parseHeaders(lines: string[]): Record<string, string>;

    /**
     * 解析curl命令中的请求体数据
     * @param lines curl命令的所有行
     * @param contentType 内容类型
     * @returns 请求体数据
     */
    abstract parseData(lines: string[], contentType: string): string;

    /**
     * 查询curl中的cookie并返回cookie字符串
     * @param curlText curl命令文本
     * @returns cookie字符串，如果没有找到则返回空字符串
     */
    abstract getCookieFromCurl(curlText: string): string;

    /**
     * 解析curl命令中的HTTP方法
     * @param lines curl命令的所有行
     * @returns HTTP方法，默认为'get'
     */
    protected parseMethod(lines: string[]): string {
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
}
