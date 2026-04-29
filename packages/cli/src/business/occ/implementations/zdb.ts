import qs from 'node:querystring';
import { service } from '@/utils/http/company-service';
import { readSecret } from '@cli-tools/shared';
import { App, Options } from '../types';

export const createZdbApp = (): App => {
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
                if (!res) {
                    throw new Error(res.data.message || '获取用户列表失败');
                }
                if (!res.length) {
                    throw new Error('未找到用户');
                }
                return service.post(`${zdb.baseUrl}/login/directLogin`, {
                    unionId: res.list[0].unionId,
                });
            })
            .then((res) => {
                if (!res) {
                    throw new Error(res.data.message || '获取门店信息失败');
                }
                console.log(`门店名称：${res.accountShop.shopName}`);
                return `https://www.zdb.com/#/login?token=${res.accountShopToken}`;
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
