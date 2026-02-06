import qs from 'node:querystring';
import serviceGenerator from '@cli-tools/shared/utils/http';
import { readSecret } from '@cli-tools/shared/utils/secret';
import { App, Options } from '../types';

export const createChainApp = (): App => {
    const service = serviceGenerator({ baseURL: '' });
    const name = 'chain';
    const serviceName = '店客多品牌连锁';
    const defaultId = '13023942325';
    const testDefaultId = '13023942325';

    const getChainList = async (params: any) => {
        const prefix = await readSecret((db) => db.oa.oldApiPrefix);
        const res = await service.post(`${prefix}/chain/occ/oa/dkdAccountDetails/accountAnalysisList`, {
            ...params,
            pageSize: 1,
            pageIndex: 1,
        });
        return res.data.result;
    };

    const getChainShopInfo = async (params: any) => {
        const prefix = await readSecret((db) => db.oa.oldApiPrefix);
        const res = await service.post(`${prefix}/chain/occ/dkdAccount/oa/getAccountToken`, params);
        return res.data.result;
    };

    const getOpenUrl = (res: any) => {
        return `https://ka.diankeduo.net/#/loginByOa?createTime=${encodeURIComponent(
            res.createTime,
        )}&id=${encodeURIComponent(res.id)}&phoneNumber=${encodeURIComponent(
            res.phoneNumber,
        )}&shopNumber=${encodeURIComponent(res.shopNumber)}&token=${encodeURIComponent(res.token)}`;
    };

    const getToken = (url: string): string => {
        const { hash } = new URL(url);
        const obj = qs.parse(hash.replace(`#/loginByOa?`, '')) as {
            token: string;
        };
        return obj.token;
    };

    const getShopUrl = async (keyword: string, options: Options) => {
        return getChainList({
            searchParam: keyword,
        })
            .then((res) => {
                return getChainShopInfo({
                    id: res.list[0].dkdAccountInfo.id,
                });
            })
            .then((res) => {
                return getOpenUrl(res);
            });
    };

    const getUserInfo = async (token: string, isTest: boolean) => {
        return token;
    };

    return {
        name,
        serviceName,
        defaultId,
        testDefaultId,
        getShopUrl,
        getUserInfo,
        getToken,
    };
};

export const chain = createChainApp();
