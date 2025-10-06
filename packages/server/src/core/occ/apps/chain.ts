import qs from 'node:querystring';
import Base from './base';
import serviceGenerator from '@/utils/http';
import { readSecret } from '@/utils/secret';

export default class extends Base {
    name = 'chain';
    searchKey = 'searchParam';
    serviceName = '店客多品牌连锁';
    defaultId = '13023942325';
    testDefaultId = '13023942325';
    prefix = '';
    service = serviceGenerator({
        baseURL: '',
    });
    async getShopUrl(keyword: string, isTest: boolean) {
        return this.getChainList({
            searchParam: keyword,
        })
            .then((res) => {
                return this.getChainShopInfo({
                    id: res.list[0].dkdAccountInfo.id,
                });
            })
            .then((res) => {
                return this.getOpenUrl(res);
            });
    }
    getOpenUrl(res: any) {
        return `https://ka.diankeduo.net/#/loginByOa?createTime=${encodeURIComponent(
            res.createTime
        )}&id=${encodeURIComponent(res.id)}&phoneNumber=${encodeURIComponent(
            res.phoneNumber
        )}&shopNumber=${encodeURIComponent(res.shopNumber)}&token=${encodeURIComponent(res.token)}`;
    }
    getToken(url: string): string {
        const { hash } = new URL(url);
        const obj = qs.parse(hash.replace(`#/loginByOa?`, '')) as {
            token: string;
        };
        return obj.token;
    }
    private async getChainList(params: any) {
        const prefix = await readSecret((db) => db.oa.oldApiPrefix);
        const res = await this.service.post(`${prefix}/chain/occ/oa/dkdAccountDetails/accountAnalysisList`, {
            ...params,
            pageSize: 1,
            pageIndex: 1,
        });
        return res.data.result;
    }
    private async getChainShopInfo(params: any) {
        const prefix = await readSecret((db) => db.oa.oldApiPrefix);
        const res = await this.service.post(`${prefix}/chain/occ/dkdAccount/oa/getAccountToken`, params);
        return res.data.result;
    }
}
