import qs from 'node:querystring';
import Base from '../core/AbstractApp';
import serviceGenerator from '@cli-tools/shared/utils/http';
import { readSecret } from '@cli-tools/shared/utils/secret';
import { Options } from '../types';

/**
 * 商品搬家应用实现
 */
export default class Spbj extends Base {
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
        }).then(this.getOpenUrl);
    }
    override async customAction(keyword: string, options: Options): Promise<any> {
        if (![].includes(options.type)) {
            throw new Error(`请指定类型:
            ms: 京东搬家
            xigua: 西瓜商品搬家`);
        }
        return this.getMoveShopList({
            name: keyword,
            wechatAccount: options.type,
        }).then(this.getOpenUrl);
    }
    private getOpenUrl(res: any) {
        const item = res.list[0];
        return `http://116.196.108.180:30015/#/login?openId=${item.wxOpenId}`;
    }
    getToken(url: string): string {
        const { hash } = new URL(url);
        const obj = qs.parse(hash.replace(`#/loginByOa?`, '')) as {
            token: string;
        };
        return obj.token;
    }
    private async getMoveShopList(params: any) {
        const prefix = await readSecret((db) => db.oa.apiPrefix);
        const res = await this.service.post(`${prefix}/moving/manage/orderPage`, {
            ...params,
            pageSize: 1,
            pageIndex: 1,
        });
        return res.data.result;
    }
}
