import serviceGenerator from '@cli-tools/shared/utils/http';
import { readSecret } from '@cli-tools/shared/utils/secret';
import { Options, App } from '../types';
import { logger } from '@cli-tools/shared/utils/logger';
import { afterSearchApp } from '../core/appRunner';

const platformTypeEnum = {
    meituan: '8',
    ele: '11',
    jingdong: '4',
};

export const createDkdMiniProgramApp = (): App => {
    const service = serviceGenerator({ baseURL: '' });
    const name = 'minip';
    const serviceName = '小程序';
    const defaultId = '18759916391';
    const testDefaultId = '18759916391';

    const getPrefix = async (isTest: boolean) => {
        return await readSecret((db) => (isTest ? db.oa.testPrefix : db.oa.apiPrefix));
    };

    const getUserCommonInfo = async (keyword: string, isTest: boolean) => {
        logger.info(`【${serviceName}】正在获取账号【${keyword}】详情`);
        const prefix = await getPrefix(isTest);
        let searchParams = {};
        if (!/\d+/.test(keyword)) {
            searchParams = {
                searchShopKey: keyword,
                searchKey: '',
            };
        } else {
            searchParams = {
                searchKey: keyword,
                searchShopKey: '',
            };
        }
        const userRes = await service.post(`${prefix}/miniProgram/queryAccountList`, {
            pageIndex: 1,
            pageSize: 1,
            platform: '',
            ...searchParams,
            showBindShop: false,
        });
        if (!userRes.data.result) {
            throw new Error('未查询到用户');
        }
        logger.info(`【${serviceName}】正在获取账号【${keyword}】下的门店`);
        const userInfo = userRes.data.result.list[0];
        const listRes = await service.post(
            `${prefix}/miniProgram/queryAccountDetail`,
            {},
            {
                params: {
                    unionId: userInfo.unionId,
                },
            },
        );
        if (!listRes.data.result) {
            throw new Error('未查询到用户店铺');
        }
        return {
            unionId: userInfo.unionId,
            shopList: listRes.data.result,
            prefix,
        };
    };

    const getDataSummarizingMatchShop = (list: any[]) => {
        for (const shop of list) {
            if (shop.platform === platformTypeEnum.meituan) {
                return {
                    platform: 'meituan',
                    shopId: shop.shopId,
                    venderId: shop.venderId,
                };
            } else if (shop.platform === platformTypeEnum.ele) {
                return {
                    platform: 'ele',
                    shopId: shop.shopId,
                    venderId: shop.venderId,
                };
            } else if (shop.platform === platformTypeEnum.jingdong) {
                return {
                    platform: 'jingdong',
                    shopId: shop.shopId,
                    venderId: shop.venderId,
                };
            }
        }
        return null;
    };

    const getShopUrl = async (keyword: string, options: Options) => {
        const { prefix, unionId, shopList } = await getUserCommonInfo(keyword, options.test);
        const target = shopList.find((item: any) => item.platform === platformTypeEnum.jingdong);
        const shopId = target.shopId;
        const res3 = await service.post(`${prefix}/miniProgram/loginShopByAdmin`, {
            platform: target.platform,
            shopId: target.shopId,
            unionId,
        });
        const token = res3.data.result.token;
        return `https://jysq.diankeduo.net/pages/jdjysq/#/login?code=${token}&shopId=${shopId}`;
    };

    const customAction = async (keyword: string, options: Options) => {
        if (options.type === 'data') {
            const { prefix, unionId, shopList } = await getUserCommonInfo(keyword, options.test);
            const res3 = await service.post(
                `${prefix}/miniProgram/getTokenByUnionId`,
                {},
                {
                    params: {
                        unionId,
                    },
                },
            );
            if (!res3.data.result) {
                throw new Error('未查询到用户店铺');
            }
            const token = res3.data.result;
            const match = getDataSummarizingMatchShop(shopList);
            if (!match) {
                 throw new Error('未找到匹配店铺');
            }
            const url = `https://jysq.diankeduo.net/pages/jdjysq/#/loginByAccount?source=dkdMiniProgram&code=${token}&url=/data&shopId=${match.shopId}&userId=${match.venderId}&fromProject=${match.platform}`;
            
            // Need to call afterSearchApp.
            await afterSearchApp(app, url, keyword, options);
            return;
        }
        return Promise.resolve();
    };

    const getUserInfo = async (token: string, isTest: boolean) => {
        return token;
    };

    const app: App = {
        name,
        serviceName,
        defaultId,
        testDefaultId,
        getShopUrl,
        getUserInfo,
        customAction,
    };

    return app;
};

export const dkdMiniProgram = createDkdMiniProgramApp();
