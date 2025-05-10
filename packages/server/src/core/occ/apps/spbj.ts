import qs from 'node:querystring';
import Base from './base';
import serviceGenerator from '@/utils/http';
import sql from '@/utils/sql';

export default class extends Base {
    name = 'spbj';
    searchKey = 'searchParam';
    serviceName = '商品搬家';
    defaultId = '测试';
    testDefaultId = '13023942325';
    prefix = '';
    service = serviceGenerator({
        baseURL: '',
    });
    async getShopUrl(keyword: string, isTest: boolean) {
        return this.getMoveShopList({
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
    private async getMoveShopList(params: any) {
        const prefix = await sql((db) => db.oa.apiPrefix);
        const res = await this.service.post(`${prefix}/moving/manage/orderPage`, {
            ...params,
            pageSize: 1,
            pageIndex: 1,
        });
        return res.data.result;
    }
}
