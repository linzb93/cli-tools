import qs from 'node:querystring';
import serviceGenerator from '@cli-tools/shared/utils/http';
import { readSecret } from '@cli-tools/shared/utils/secret';
import { App, Options } from '../types';

export const createZdbApp = (): App => {
    const service = serviceGenerator({ baseURL: '' });
    const name = 'zdb';
    const serviceName = '涨单宝小程序';
    const defaultId = '-';
    const testDefaultId = '-';

    const getToken = (url: string): string => {
        const { hash } = new URL(url);
        const obj = qs.parse(hash.replace(`#/login?`, '')) as {
            token: string;
        };
        return obj.token;
    };

    const getShopUrl = async (keyword: string, options: Options) => {
        const { zdb } = await readSecret((db) => db.oa);
        return service
            .post(`${zdb.baseUrl}/login/directLogin`, {
                unionId: zdb.unionId,
            })
            .then((res) => {
                console.log(`门店名称：${res.data.result.accountShop.shopName}`);
                return `https://www.zdb.com/#/login?token=${res.data.result.accountShopToken}`;
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

export const zdb = createZdbApp();
