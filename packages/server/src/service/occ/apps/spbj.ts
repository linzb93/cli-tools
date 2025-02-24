import qs from 'node:querystring';
import Base from './base';
import { getMoveShopList } from '@/model/http/occ';

export default class extends Base {
    name = 'spbj';
    searchKey = 'searchParam';
    serviceName = '商品搬家';
    defaultId = '测试';
    testDefaultId = '13023942325';
    prefix = '';
    async getShopUrl(keyword: string, isTest: boolean) {
        return getMoveShopList({
            name: keyword,
        }).then((res) => {
            return this.getOpenUrl(res);
        });
    }
    private getOpenUrl(res: any) {
        const item = res.list[0];
        return `https://spbjapp.diankeduo.net/pages/spbjapp/#/login?openId=${item.wxOpenId}`;
    }
    getToken(url: string): string {
        const { hash } = new URL(url);
        const obj = qs.parse(hash.replace(`#/loginByOa?`, '')) as {
            token: string;
        };
        return obj.token;
    }
}
