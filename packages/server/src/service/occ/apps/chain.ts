import qs from 'node:querystring';
import Base from './base';
import { getChainList, getChainShopInfo } from '@/model/http/occ';

export default class extends Base {
    name = 'chain';
    searchKey = 'searchParam';
    serviceName = '店客多品牌连锁';
    defaultId = '13023942325';
    testDefaultId = '13023942325';
    prefix = '';
    async getShopUrl(keyword: string, isTest: boolean) {
        return getChainList({
            searchParam: keyword,
        })
            .then((res) => {
                return getChainShopInfo(
                    {
                        id: res.list[0].dkdAccountInfo.id,
                    },
                    isTest
                );
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
}
