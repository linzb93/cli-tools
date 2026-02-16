export interface Options {
    /**
     * 需要显示的其他headers字段
     */
    extra?: string;
    /**
     * 是否显示全部headers字段
     */
    full?: boolean;
}

export interface CurlParser {
    parseUrl(line: string): string;
    parseHeaders(lines: string[]): Record<string, string>;
    parseData(lines: string[], contentType: string): string;
    getCookieFromCurl(curlText: string): string;
    parseMethod(lines: string[]): string;
}
