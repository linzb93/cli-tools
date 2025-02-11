import jwt from 'jsonwebtoken';
import Time from '@/service/time';
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
    help?: boolean;
}

const strategyList = [
    {
        name: 'jwt',
        action(token: string, options: Options): string {
            const tokenStr = token.replace(/^(.+_)?/, ''); // 把前面可能有的occ_senior_去掉
            const decoded = jwt.decode(tokenStr, {
                complete: options.complete,
            }) as AnyObject; // 解析数据格式不定
            console.log(decoded);
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
        for (const item of strategyList) {
            try {
                decoded = item.action(tk, options);
            } catch (error) {
                continue;
            }
        }
        if (!decoded) {
            console.log('无法解析token');
            return;
        }
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
