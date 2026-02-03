import qs from 'node:querystring';
import Base from './base';
import serviceGenerator from '../../../utils/http';
import { readSecret } from '../../../utils/secret';

export default class extends Base {
    name = 'zdb';
    searchKey = 'searchParam';
    serviceName = '店客多品牌连锁';
    defaultId = '13023942325';
    testDefaultId = '13023942325';
    prefix = '';
    service = serviceGenerator({
        baseURL: '',
    });
    async getShopUrl(keyword: string, isTest: boolean) {
        const { zdb } = await readSecret((db) => db.oa);
        return this.service
            .post(`${zdb.baseUrl}/login/directLogin`, {
                unionId: zdb.unionId,
            })
            .then((res) => `https://www.zdb.com/#/login?token=${res.data.result.accountShopToken}`);
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
