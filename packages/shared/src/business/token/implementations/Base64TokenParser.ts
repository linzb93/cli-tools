import { TokenParser } from '../core/TokenParser';

/**
 * Base64 Token解析器
 */
export class Base64TokenParser extends TokenParser {
    /**
     * 解析Base64格式token
     * @param token Base64编码的token字符串
     * @param options 解析选项
     * @returns 解析后的数据
     */
    parse(token: string): string {
        const str = Buffer.from(token, 'base64');
        const resultStr = str.toString();
        try {
            return JSON.parse(resultStr);
        } catch (error) {
            const leftSecondIndex = resultStr.lastIndexOf('{');
            const rightSecondIndex = resultStr.lastIndexOf('}');
            if (leftSecondIndex !== -1 && rightSecondIndex !== -1) {
                return JSON.parse(resultStr.substring(leftSecondIndex, rightSecondIndex + 1));
            }
            return resultStr;
        }
    }

    /**
     * 获取解析器名称
     * @returns 解析器名称
     */
    getName(): string {
        return 'base64';
    }
}
