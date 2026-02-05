import qs from 'node:querystring';
import Base from '../core/AbstractApp';
import serviceGenerator from '@cli-tools/shared/utils/http';
import { readSecret } from '@cli-tools/shared/utils/secret';

/**
 * ZDB应用实现
 */
export default class Zdb extends Base {
    name = 'zdb';
    searchKey = 'searchParam';
    serviceName = '涨单宝小程序';
    defaultId = '-';
    testDefaultId = '-';
    prefix = '';
    service = serviceGenerator({
        baseURL: '',
    });
    async getShopUrl() {
        const { zdb } = await readSecret((db) => db.oa);
        return this.service
            .post(`${zdb.baseUrl}/login/directLogin`, {
                unionId: zdb.unionId,
            })
            .then((res) => {
                console.log(`门店名称：${res.data.result.accountShop.shopName}`);
                return `https://www.zdb.com/#/login?token=${res.data.result.accountShopToken}`;
            });
    }
    getOpenUrl(res: any) {
        return `https://ka.diankeduo.net/#/loginByOa?createTime=${encodeURIComponent(
            res.createTime,
        )}&id=${encodeURIComponent(res.id)}&phoneNumber=${encodeURIComponent(
            res.phoneNumber,
        )}&shopNumber=${encodeURIComponent(res.shopNumber)}&token=${encodeURIComponent(res.token)}`;
    }
    getToken(url: string): string {
        const { hash } = new URL(url);
        const obj = qs.parse(hash.replace(`#/login?`, '')) as {
            token: string;
        };
        return obj.token;
    }
}
