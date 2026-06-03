import { BasePlatform } from '../core/BasePlatform';
import { stringify } from 'node:querystring';
import { logger } from '@/utils/logger';
import { Options } from '../types';
import { getUserList, directLogin } from '../repository/zdb';
import { platformMap as ptMap } from '../constants';
import { readSecret } from '@cli-tools/shared';
export class Zdb extends BasePlatform {
    name = 'zdb';
    serviceName = '涨单宝小程序';
    defaultId = '15659169542';
    testDefaultId = '-';
    appKey = 'zdb';
    async getShopUrl(keyword: string, options: Options) {
        const userRes = await getUserList(keyword);
        if (!userRes.list.length) {
            throw new Error('未找到用户');
        }
        const { platform } = options;
        let platformId = ptMap[platform];
        const loginRes = await directLogin({ unionId: userRes.list[0].unionId, platform: platformId });
        if (!loginRes.accountShop) {
            throw new Error('获取门店信息失败');
        }
        logger.info(`门店名称：${loginRes.accountShop.shopName}`);
        const { origin } = await readSecret((db) => db.oa.zdb);
        return `${origin}#/login?${stringify({
            token: loginRes.accountShopToken,
            platform: platformId,
        })}`;
    }

    async getUserInfo() {
        return '';
    }
    getToken(url: string): string {
        return super.getToken(url, 'token');
    }
}
