import Base from '../core/AbstractApp';
import serviceGenerator from '@cli-tools/shared/src/utils/http';
import { readSecret } from '@cli-tools/shared/src/utils/secret';
import { Options } from '../types';
import { logger } from '@cli-tools/shared/src/utils/logger';

const platformTypeEnum = {
    meituan: '8',
    ele: '11',
    jingdong: '4',
};

/**
 * 小程序应用实现
 */
export default class DkdMiniProgram extends Base {
    name = 'minip';
    searchKey = 'searchParam';
    serviceName = '小程序';
    defaultId = '18759916391';
    testDefaultId = '18759916391';
    service = serviceGenerator({
        baseURL: '',
    });

    /**
     * 获取店铺URL
     * @param {string} keyword - 搜索关键词
     * @param {boolean} isTest - 是否为测试环境
     * @returns {Promise<string>} 店铺URL
     */
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

    /**
     * 自定义操作
     * @param {string} keyword - 关键词
     * @param {Options} options - 选项
     * @returns {Promise<void>}
     */
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
                },
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

    /**
     * 获取API前缀
     * @param {boolean} isTest - 是否为测试环境
     * @returns {Promise<string>} API前缀
     */
    private async getPrefix(isTest: boolean) {
        return await readSecret((db) => (isTest ? db.oa.testPrefix : db.oa.apiPrefix));
    }

    /**
     * 获取用户通用信息
     * @param {string} keyword - 关键词
     * @param {boolean} isTest - 是否为测试环境
     * @returns {Promise<{unionId: string, shopList: any[], prefix: string}>} 用户信息对象
     */
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
    }

    /**
     * 获取数据汇总匹配的店铺
     * @param {any[]} list - 店铺列表
     * @returns {{platform: string, shopId: string, venderId: string} | null} 匹配的店铺信息
     */
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
