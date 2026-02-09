import { Options } from '../types';

/**
 * Token解析器接口
 */
export interface TokenParser {
    /**
     * 解析token的方法
     * @param token 待解析的token字符串
     * @param options 解析选项
     * @returns 解析后的数据
     */
    parse: (token: string, options: Options) => any;

    /**
     * 解析器名称
     */
    name: string;
}
