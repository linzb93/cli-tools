import qs from 'node:querystring';
import serviceGenerator from '@/utils/http';
import { readSecret } from '@cli-tools/shared';
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
            .post(`${zdb.baseUrl}/admin/user/list`, {
                pageIndex: 1,
                pageSize: 1,
                keyword: zdb.keyword,
            })
            .then((res) => {
                if (!res.data.result) {
                    throw new Error(res.data.message || '获取用户列表失败');
                }
                if (!res.data.result.length) {
                    throw new Error('未找到用户');
                }
                return service.post(`${zdb.baseUrl}/login/directLogin`, {
                    unionId: res.data.result.list[0].unionId,
                });
            })
            .then((res) => {
                if (!res.data.result) {
                    throw new Error(res.data.message || '获取门店信息失败');
                }
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
