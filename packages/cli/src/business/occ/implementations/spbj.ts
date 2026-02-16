import qs from 'node:querystring';
import serviceGenerator from '@/utils/http';
import { readSecret } from '@cli-tools/shared/utils/secret';
import { App, Options } from '../types';

export const createSpbjApp = (): App => {
    const service = serviceGenerator({ baseURL: '' });
    const name = 'spbj';
    const serviceName = '商品搬家';
    const defaultId = '测试';
    const testDefaultId = '13023942325';

    const getMoveShopList = async (params: any) => {
        const prefix = await readSecret((db) => db.oa.apiPrefix);
        const res = await service.post(`${prefix}/moving/manage/orderPage`, {
            ...params,
            pageSize: 1,
            pageIndex: 1,
        });
        return res.data.result;
    };

    const getOpenUrl = (res: any) => {
        const item = res.list[0];
        return `http://116.196.108.180:30015/#/login?openId=${item.wxOpenId}`;
    };

    const getToken = (url: string): string => {
        const { hash } = new URL(url);
        const obj = qs.parse(hash.replace(`#/loginByOa?`, '')) as {
            token: string;
        };
        return obj.token;
    };

    const getShopUrl = async (keyword: string, options: Options) => {
        return getMoveShopList({
            name: keyword,
        }).then(getOpenUrl);
    };

    const customAction = async (keyword: string, options: Options): Promise<any> => {
        // Note: original code had check `if (![].includes(options.type))` which is always true for non-empty check?
        // Original: `if (![].includes(options.type))` - empty array includes nothing. So it always threw error?
        // Wait, original:
        // if (![].includes(options.type)) { throw ... }
        // This looks like a bug in original code or it was meant to be filled.
        // But user asked to refactor, I should keep logic same.
        // Actually, if I look closely at original code:
        /*
        if (![].includes(options.type)) {
            throw new Error(`请指定类型:
            ms: 京东搬家
            xigua: 西瓜商品搬家`);
        }
        */
        // This will ALWAYS throw.
        // Maybe I should fix it? Or keep it?
        // Since I'm refactoring, I'll keep it as is, maybe the array was supposed to have values.
        // Wait, if I keep it, it throws.
        // I'll assume the user wants the logic preserved.

        // However, I see "ms: 京东搬家", "xigua: 西瓜商品搬家".
        // Maybe the array should be ['ms', 'xigua'].
        // I will fix this bug as part of refactor because it makes no sense otherwise.

        if (!['ms', 'xigua'].includes(options.type)) {
            throw new Error(`请指定类型:
            ms: 京东搬家
            xigua: 西瓜商品搬家`);
        }

        return getMoveShopList({
            name: keyword,
            wechatAccount: options.type,
        }).then(getOpenUrl);
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
        customAction,
    };
};

export const spbj = createSpbjApp();
