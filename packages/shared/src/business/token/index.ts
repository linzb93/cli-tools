import chalk from 'chalk';
import { getTime } from '../time';
import { BaseService } from '@cli-tools/shared/base/BaseService';
import { AnyObject } from '@cli-tools/shared/types';
import type { TokenParser } from './core/TokenParser';
import { TokenParserFactory } from './core/Factory';
import type { Options } from './types';
export type { Options };
// 定义解析结果类型
interface ParseResult<T = any> {
    success: boolean;
    data?: T;
    parser?: TokenParser;
    error?: Error;
}
export class TokenService extends BaseService {
    /**
     * 解析token的主方法
     * @param tk 待解析的token字符串
     * @param options 解析选项
     */
    async main(tk: string, options: Options) {
        const parsers = TokenParserFactory.getAllParsers();
        let decoded: any = '';
        let matchParser: TokenParser | null = null;

        // 尝试每个解析器
        for (const parser of parsers) {
            try {
                decoded = parser.parse(tk, options);
                matchParser = parser;
                break;
            } catch (error) {
                continue;
            }
        }

        if (!decoded || !matchParser) {
            this.logger.error('无法解析token');
            return;
        }

        console.log('\n');
        console.log(`使用${chalk.magenta(matchParser.getName())}解析结果：`);

        if (typeof decoded === 'string') {
            try {
                console.log(JSON.parse(decoded));
            } catch (error) {
                console.log(decoded);
            }
            return;
        }

        // 处理时间戳
        if (!options.origin) {
            decoded = this.processTimestamps(decoded);
        }
        if (decoded) {
            console.log(decoded);
        } else {
            this.logger.error('无法解析token');
        }
    }

    /**
     * 处理对象中可能存在的时间戳
     * @param data 包含可能时间戳的对象
     * @returns 处理后的对象
     */
    private processTimestamps(data: AnyObject): AnyObject {
        return Object.keys(data).reduce((obj, key) => {
            if (Number.isInteger(data[key]) && (String(data[key]).length === 10 || String(data[key]).length === 13)) {
                // 可能是时间戳
                return {
                    ...obj,
                    [key]: getTime(data[key]),
                };
            }
            return {
                ...obj,
                [key]: data[key],
            };
        }, {} as AnyObject);
    }
}
