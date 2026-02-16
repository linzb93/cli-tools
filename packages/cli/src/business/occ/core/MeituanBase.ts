import serviceGenerator from '@/utils/http';
import { readSecret } from '@cli-tools/shared/utils/secret';
import { login } from '../utils/login';
import chalk from 'chalk';
import { App, Options, UserInfo } from '../types';
import { getToken } from './appRunner';

interface MeituanAppConfig {
    name: string;
    appKey: string;
    serviceName: string;
    defaultId: string;
    testDefaultId: string;
    userApi?: string;
    openPC?: (url: string, shopName: string) => void;
}

export const createMeituanApp = (config: MeituanAppConfig): App => {
    const { name, appKey, serviceName, defaultId, testDefaultId, userApi = 'home', openPC } = config;
    const platform = 8;
    const service = serviceGenerator({ baseURL: '' });

    const getPrefix = async (isTest: boolean) => {
        return await readSecret((db) => (isTest ? db.oa.testPrefix : db.oa.apiPrefix));
    };

    const getMeituanShopUrl = async (params: any, isTest: boolean) => {
        const prefix = await getPrefix(isTest);
        const res = await service.post(`${prefix}/occ/order/replaceUserLogin`, params);
        return res.data.result;
    };

    const queryBusinessInfoList = async (obj: {
        version: number;
        pageIndex: number;
        pageSize?: number;
        minPrice?: number;
    }) => {
        const { version, pageIndex, pageSize = 10 } = obj;
        const prefix = await readSecret((db) => db.oa.apiPrefix);
        const token = await readSecret((db) => db.oa.token);
        return service.post<{
            result: {
                list: {
                    shopId: string;
                    shopName: string;
                    memberId: string;
                }[];
            };
            code: number;
        }>(
            `${prefix}/query/businessInfoList`,
            {
                pageIndex,
                pageSize,
                memberId: '',
                timeType: 1,
                startTime: '',
                endTime: '',
                minPrice: '',
                maxPrice: '',
                minOrderTimes: '',
                maxOrderTimes: '',
                param: '',
                remarks: '',
                appKey: appKey,
                type: '0',
                customerType: 0,
                customerClassify: 0,
                version,
                distributionStatus: 0,
                payStatus: 0,
                loginer: '',
                orderType: 0,
                sortType: 0,
            },
            {
                headers: {
                    token,
                },
            },
        );
    };

    const getUserInfo = async (token: string, isTest: boolean): Promise<UserInfo> => {
        const prefix = await getPrefix(isTest);
        const res = await service.post<{
            result: UserInfo;
        }>(
            `${prefix}/meituan/${userApi}`,
            {},
            {
                headers: {
                    token,
                },
            },
        );
        return res.data.result;
    };

    const findMatchShop = async (
        obj: { version: number; pageIndex: number; pageSize?: number; minPrice?: number },
        condition: (shop: UserInfo) => boolean,
    ) => {
        let { version, pageIndex, pageSize = 10, minPrice = 0 } = obj;
        let resultURL = '';
        while (resultURL === '') {
            const res = await queryBusinessInfoList({
                version,
                pageIndex,
                pageSize,
                minPrice,
            });
            const { list } = res.data.result;
            for (const shop of list) {
                const { memberId } = shop;
                const shopUrl = await getMeituanShopUrl(
                    {
                        appKey: appKey,
                        memberId,
                        platform: platform,
                    },
                    false,
                );
                const token = getToken(shopUrl);
                const userInfo = await getUserInfo(token, false);
                if (condition(userInfo)) {
                    resultURL = shopUrl;
                    return shopUrl;
                }
            }
            pageIndex++;
        }
        return '';
    };

    const filterShops = async (options: { version: number }): Promise<string> => {
        const { version } = options;
        let pageIndex = 1;
        let resultURL = '';
        if (version === 0) {
            resultURL = await findMatchShop({ version, pageIndex, pageSize: 10 }, (userInfo) => {
                return !userInfo.version && !userInfo.versionPlus && !(userInfo.surplusDays > 0);
            });
            return resultURL;
        } else if (version === 1) {
            resultURL = await findMatchShop({ version, pageIndex, pageSize: 10 }, (userInfo) => {
                return userInfo.version === 1 && !userInfo.versionPlus;
            });
            return resultURL;
        } else if (version === 2) {
            resultURL = await findMatchShop({ version, pageIndex, pageSize: 10 }, (userInfo) => {
                return userInfo.versionPlus === 1;
            });
            return resultURL;
        } else if (version === 3) {
            return '';
        }
        return '';
    };

    const getByVersion = async (version: number, shopName: string): Promise<string> => {
        try {
            let { token } = await readSecret((db) => db.oa);
            if (!token) {
                await login();
                return getByVersion(version, shopName);
            }
            const res = await queryBusinessInfoList({ version, pageIndex: 1, pageSize: 1 });
            if (res.data.code !== 200) {
                await login();
                return getByVersion(version, shopName);
            }
            const shopUrl = await filterShops({ version });
            return shopUrl;
        } catch (error) {
            console.error(chalk.red('获取版本信息时发生错误:'), error.message);
            process.exit(1);
        }
    };

    const getShopUrl = async (keyword: string, options: Options): Promise<string> => {
        if (options.version) {
            return await getByVersion(options.version, keyword);
        }
        return getMeituanShopUrl(
            {
                appKey: appKey,
                memberId: keyword,
                platform: platform,
            },
            options.test,
        );
    };

    return {
        name,
        serviceName,
        defaultId,
        testDefaultId,
        getShopUrl,
        getUserInfo,
        openPC,
    };
};
