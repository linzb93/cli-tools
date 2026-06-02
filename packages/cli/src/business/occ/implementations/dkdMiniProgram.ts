import { logger } from '@/utils/logger';
import { BasePlatform } from '../core/BasePlatform';
import { Options, GetUserInfoRequest } from '../types';
import {
    queryMiniProgramAccountList,
    queryMiniProgramAccountDetail,
    loginMiniProgramShopByAdmin,
    getMiniProgramTokenByUnionId,
} from '../repository/miniprogram';
import { readSecret } from '@cli-tools/shared';
import { afterSearchApp } from '../service';

const platformTypeEnum = {
    meituan: '8',
    taobao: '11',
    jingdong: '4',
};

export class DkdMiniProgramApp extends BasePlatform {
    name = 'minip';
    serviceName = '小程序';
    defaultId = '18759916391';
    testDefaultId = '18759916391';
    appKey = '';
    async getShopUrl(keyword: string, options: Options) {
        if (options.type === 'data') {
            return this.customAction(keyword, options);
        }
        const commonInfo = await this.getCommonInfo(keyword, false);
        const target = commonInfo.shopList.find((item: any) => item.platform === platformTypeEnum.jingdong);
        if (!target) {
            throw new Error('未查询到用户店铺');
        }
        const res3 = await loginMiniProgramShopByAdmin(
            {
                platform: target.platform,
                shopId: target.shopId,
                unionId: commonInfo.unionId,
            },
            false,
        );
        return `https://jysq.diankeduo.net/pages/jdjysq/#/login?code=${res3.token}&shopId=${target.shopId}`;
    }
    async getUserInfo(params: GetUserInfoRequest): Promise<any> {
        return params.token;
    }
    private async getCommonInfo(keyword: string, isTest: boolean) {
        logger.info(`【${this.serviceName}】正在获取账号【${keyword}】详情`);
        let searchParams: { searchKey?: string; searchShopKey?: string } = {};
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
        const userRes = await queryMiniProgramAccountList(searchParams, isTest);
        if (!userRes) {
            throw new Error('未查询到用户');
        }
        logger.info(`【${this.serviceName}】正在获取账号【${keyword}】下的门店`);
        const userInfo = userRes.list[0];
        const listRes = await queryMiniProgramAccountDetail(userInfo.unionId, isTest);
        if (!listRes) {
            throw new Error('未查询到用户店铺');
        }
        return {
            unionId: userInfo.unionId,
            shopList: listRes,
            isTest,
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
            } else if (shop.platform === platformTypeEnum.taobao) {
                return {
                    platform: 'taobao',
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
    private async customAction(keyword: string, options: Options): Promise<string> {
        if (options.type === 'data') {
            const { unionId, shopList, isTest } = await this.getCommonInfo(keyword, options.test);
            const token = await getMiniProgramTokenByUnionId(unionId, isTest);
            if (!token) {
                throw new Error('未查询到用户店铺');
            }
            const match = this.getDataSummarizingMatchShop(shopList);
            if (!match) {
                throw new Error('未找到匹配店铺');
            }
            const url = `https://jysq.diankeduo.net/pages/jdjysq/#/loginByAccount?source=dkdMiniProgram&code=${token}&url=/data&shopId=${match.shopId}&userId=${match.venderId}&fromProject=${match.platform}`;
            return url;
        }
        return Promise.resolve('');
    }
}
