import jwt from 'jsonwebtoken';
import chalk from 'chalk';
import Time from '../time';
import BaseCommand from '@/common/BaseCommand';
import { AnyObject } from '@/typings';

export interface Options {
    /**
     * 原始数据，时间戳没有解析成标准时间格式
     */
    origin?: boolean;
    /**
     * 完整数据，包括算法等
     */
    complete?: boolean;
}

const strategyList = [
    {
        name: 'jwt',
        action(token: string, options: Options): string {
            const tokenStr = token.replace(/^(.+_)?/, ''); // 把前面可能有的occ_senior_去掉
            const decoded = jwt.decode(tokenStr, {
                complete: options.complete,
            }) as AnyObject; // 解析数据格式不定
            if (!decoded) {
                throw new Error('无法解析');
            }
            return decoded as unknown as string;
        },
    },
    {
        name: 'base64',
        action(token: string) {
            const str = Buffer.from(token, 'base64');
            return str.toString('utf8');
        },
    },
];

export default class extends BaseCommand {
    async main(tk: string, options: Options) {
        let decoded = '';
        let matchTitle = '';
        for (const item of strategyList) {
            try {
                decoded = item.action(tk, options);
                matchTitle = item.name;
                break;
            } catch (error) {
                continue;
            }
        }
        if (!decoded) {
            console.log('无法解析token');
            return;
        }
        console.log(`使用${chalk.magenta(matchTitle)}解析结果：`);
        if (typeof decoded === 'string') {
            try {
                console.log(JSON.parse(decoded));
            } catch (error) {
                console.log(decoded);
            }
            return;
        }
        const result = Object.keys(decoded).reduce((obj, key) => {
            if (
                Number.isInteger(decoded[key]) &&
                //@ts-ignore
                (decoded[key].toString().length === 10 || decoded[key].toString().length === 13)
            ) {
                // 可能是时间戳
                return {
                    ...obj,
                    [key]: new Time().get(decoded[key]),
                };
            }
            return {
                ...obj,
                [key]: decoded[key],
            };
        }, {});
        console.log(result || '无法解析token');
    }
}
