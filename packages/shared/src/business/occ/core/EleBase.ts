import serviceGenerator from '@cli-tools/shared/utils/http';
import { readSecret } from '@cli-tools/shared/utils/secret';
import { App, Options } from '../types';

interface EleAppConfig {
    name: string;
    appKey: string;
    serviceName: string;
    defaultId: string;
    testDefaultId: string;
}

export const createEleApp = (config: EleAppConfig): App => {
    const { name, appKey, serviceName, defaultId, testDefaultId } = config;
    const platform = 11;
    const service = serviceGenerator({ baseURL: '' });

    const getPrefix = async (isTest: boolean) => {
        return await readSecret((db) => (isTest ? db.oa.testPrefix : db.oa.apiPrefix));
    };

    const getEleShopUrl = async (params: any, isTest: boolean) => {
        const prefix = await getPrefix(isTest);
        const res = await service.post(`${prefix}/eleOcc/auth/onelogin`, params);
        return res.data.result;
    };

    const getEleShopList = async (params: any, isTest: boolean) => {
        const prefix = await getPrefix(isTest);
        const res = await service.post(`${prefix}/eleOcc/manage/getOrderList`, {
            ...params,
            pageSize: 1,
            pageIndex: 1,
        });
        return res.data.result;
    };

    const getEleUserInfo = async (token: string, isTest: boolean) => {
        const prefix = await getPrefix(isTest);
        const res = await service.post(
            `${prefix}/meituan/homeUserInfo`,
            {},
            {
                headers: {
                    token,
                },
            },
        );
        return res.data.result;
    };

    const getShopUrl = async (keyword: string, options: Options): Promise<string> => {
        const isTest = options.test;
        return getEleShopList(
            {
                appId: appKey,
                platform: platform,
                param: keyword,
            },
            isTest,
        ).then((res) => {
            return getEleShopUrl(
                {
                    appId: appKey,
                    shopId: keyword,
                    userId: res.list[0].userId,
                },
                isTest,
            );
        });
    };

    const getUserInfo = async (token: string, isTest: boolean): Promise<any> => {
        return getEleUserInfo(token, isTest);
    };

    return {
        name,
        serviceName,
        defaultId,
        testDefaultId,
        getShopUrl,
        getUserInfo,
    };
};
