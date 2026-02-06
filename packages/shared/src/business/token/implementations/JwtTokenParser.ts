import jwt from 'jsonwebtoken';
import { TokenParser } from '../core/TokenParser';
import { Options } from '../types';
import { AnyObject } from '../../../types';

/**
 * JWT Token解析器
 */
export const jwtTokenParser: TokenParser = {
    name: 'jwt',
    /**
     * 解析JWT格式token
     * @param token JWT token字符串
     * @param options 解析选项
     * @returns 解析后的数据
     */
    parse: (token: string, options: Options): AnyObject => {
        const tokenStr = token.replace(/^(.+_)?/, ''); // 把前面可能有的occ_senior_去掉
        const decoded = jwt.decode(tokenStr, {
            complete: options.complete,
        }) as AnyObject; // 解析数据格式不定
        if (!decoded) {
            throw new Error('无法解析');
        }
        return decoded;
    },
};
