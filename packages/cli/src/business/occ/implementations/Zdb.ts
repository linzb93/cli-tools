import { BasePlatform } from '../core/BasePlatform';
import qs from 'node:querystring';
import { getUserList, directLogin } from '../repository/zdb';

export class Zdb extends BasePlatform {
    name = 'zdb';
    serviceName = '涨单宝小程序';
    defaultId = '-';
    testDefaultId = '-';
    appKey = 'zdb';
    async getShopUrl() {
        return getUserList()
            .then((res: any) => {
                if (!res) {
                    throw new Error('获取用户列表失败');
                }
                if (!res.list.length) {
                    throw new Error('未找到用户');
                }
                return directLogin(res.list[0].unionId);
            })
            .then((res: any) => {
                if (!res) {
                    throw new Error('获取门店信息失败');
                }
                console.log(`门店名称：${res.accountShop.shopName}`);
                return `https://www.zdb.com/#/login?token=${res.accountShopToken}`;
            });
    }

    async getUserInfo(token: string, userApi: string, isTest: boolean) {
        return token;
    }
    getToken(url: string): string {
        const { hash } = new URL(url);
        const obj = qs.parse(hash.replace(`#/login?`, '')) as {
            token: string;
        };
        return obj.token;
    }
}
