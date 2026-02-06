import chalk from 'chalk';
import { getTime } from '../time';
import { AnyObject } from '@cli-tools/shared/types';
import type { TokenParser } from './core/TokenParser';
import { getAllParsers } from './core/Factory';
import type { Options } from './types';
import { logger } from '../../utils/logger';

export type { Options };

/**
 * 处理对象中可能存在的时间戳
 * @param data 包含可能时间戳的对象
 * @returns 处理后的对象
 */
const processTimestamps = (data: AnyObject): AnyObject => {
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
};

/**
 * 解析token的主方法
 * @param tk 待解析的token字符串
 * @param options 解析选项
 */
export const token = async (tk: string, options: Options) => {
    const parsers = getAllParsers();
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
        logger.error('无法解析token');
        return;
    }

    console.log('\n');
    console.log(`使用${chalk.magenta(matchParser.name)}解析结果：`);

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
        decoded = processTimestamps(decoded);
    }
    if (decoded) {
        console.log(decoded);
    } else {
        logger.error('无法解析token');
    }
};
