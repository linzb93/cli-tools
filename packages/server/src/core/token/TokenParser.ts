import { Options } from './index';

/**
 * Token解析器基类
 */
abstract class TokenParser {
    /**
     * 解析token的方法，子类必须实现
     * @param token 待解析的token字符串
     * @param options 解析选项
     * @returns 解析后的数据
     */
    abstract parse(token: string, options: Options): any;

    /**
     * 获取解析器名称
     * @returns 解析器名称
     */
    abstract getName(): string;
}

export default TokenParser;
