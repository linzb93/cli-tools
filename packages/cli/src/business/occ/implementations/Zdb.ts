import { BasePlatform } from '../core/BasePlatform';
import qs from 'node:querystring';
import { logger } from '@/utils/logger';
import { GetUserInfoRequest } from '../types';
import { getUserList, directLogin } from '../repository/zdb';

export class Zdb extends BasePlatform {
    name = 'zdb';
    serviceName = '涨单宝小程序';
    defaultId = '15505916470';
    testDefaultId = '-';
    appKey = 'zdb';
    async getShopUrl(keyword: string) {
        return getUserList(keyword)
            .then((res) => {
                if (!res.list.length) {
                    throw new Error('未找到用户');
                }
                return directLogin({ unionId: res.list[0].unionId });
            })
            .then((res) => {
                if (!res.accountShop) {
                    throw new Error('获取门店信息失败');
                }
                logger.info(`门店名称：${res.accountShop.shopName}`);
                return `https://www.zdb.com/#/login?token=${res.accountShopToken}`;
            });
    }

    async getUserInfo(params: GetUserInfoRequest): Promise<any> {
        return params.token;
    }
    getToken(url: string): string {
        const { hash } = new URL(url);
        const obj = qs.parse(hash.replace(`#/login?`, '')) as {
            token: string;
        };
        return obj.token;
    }
}
