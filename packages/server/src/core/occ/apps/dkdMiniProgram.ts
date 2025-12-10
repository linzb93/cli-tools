import Base from './base';
import serviceGenerator from '@/utils/http';
import { readSecret } from '@/utils/secret';
import { Options } from '../types';
import { logger } from '@/utils/logger';
const platformTypeEnum = {
    meituan: '8',
    ele: '11',
    jingdong: '4',
};
/**
 * 小程序的应用类
 */
export default class extends Base {
    name = 'minip';
    searchKey = 'searchParam';
    serviceName = '小程序';
    defaultId = '18759916391';
    testDefaultId = '18759916391';
    service = serviceGenerator({
        baseURL: '',
    });
    async getShopUrl(keyword: string, isTest: boolean) {
        const { prefix, unionId, shopList } = await this.getUserCommonInfo(keyword, isTest);
        const target = shopList.find((item) => item.platform === platformTypeEnum.jingdong);
        const shopId = target.shopId;
        const res3 = await this.service.post(`${prefix}/miniProgram/loginShopByAdmin`, {
            platform: target.platform,
            shopId: target.shopId,
            unionId,
        });
        const token = res3.data.result.token;
        return `https://jysq.diankeduo.net/pages/jdjysq/#/login?code=${token}&shopId=${shopId}`;
    }
    override async customAction(keyword: string, options: Options): Promise<void> {
        if (options.type === 'data') {
            const { prefix, unionId, shopList } = await this.getUserCommonInfo(keyword, options.test);
            const res3 = await this.service.post(
                `${prefix}/miniProgram/getTokenByUnionId`,
                {},
                {
                    params: {
                        unionId,
                    },
                }
            );
            if (!res3.data.result) {
                throw new Error('未查询到用户店铺');
            }
            const token = res3.data.result;
            const match = this.getDataSummarizingMatchShop(shopList);
            const url = `https://jysq.diankeduo.net/pages/jdjysq/#/loginByAccount?source=dkdMiniProgram&code=${token}&url=/data&shopId=${match.shopId}&userId=${match.venderId}&fromProject=${match.platform}`;
            await this.afterSearch(url, keyword, options);
            return;
        }
        return Promise.resolve();
    }
    private async getPrefix(isTest: boolean) {
        return await readSecret((db) => (isTest ? db.oa.testPrefix : db.oa.apiPrefix));
    }
    private async getUserCommonInfo(keyword: string, isTest: boolean) {
        logger.info(`【${this.serviceName}】正在获取账号【${keyword}】详情`);
        const prefix = await this.getPrefix(isTest);
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
        const userRes = await this.service.post(`${prefix}/miniProgram/queryAccountList`, {
            pageIndex: 1,
            pageSize: 1,
            platform: '',
            ...searchParams,
            showBindShop: false,
        });
        if (!userRes.data.result) {
            throw new Error('未查询到用户');
        }
        logger.info(`【${this.serviceName}】正在获取账号【${keyword}】下的门店`);
        const userInfo = userRes.data.result.list[0];
        const listRes = await this.service.post(
            `${prefix}/miniProgram/queryAccountDetail`,
            {},
            {
                params: {
                    unionId: userInfo.unionId,
                },
            }
        );
        if (!listRes.data.result) {
            throw new Error('未查询到用户店铺');
        }
        return {
            unionId: userInfo.unionId,
            shopList: listRes.data.result,
            prefix,
        };
    }
    private getDataSummarizingMatchShop = (list: any[]) => {
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
}
