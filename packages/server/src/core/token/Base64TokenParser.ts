import TokenParser from './TokenParser';
import { Options } from './index';

/**
 * Base64 Token解析器
 */
class Base64TokenParser extends TokenParser {
    /**
     * 解析Base64格式token
     * @param token Base64编码的token字符串
     * @param options 解析选项
     * @returns 解析后的数据
     */
    parse(token: string, options: Options): string {
        const str = Buffer.from(token, 'base64');
        return str.toString('utf8');
    }

    /**
     * 获取解析器名称
     * @returns 解析器名称
     */
    getName(): string {
        return 'base64';
    }
}

export default Base64TokenParser;
