import { BasePlatform } from '../core/BasePlatform';
import qs from 'node:querystring';
import { logger } from '@/utils/logger';
import { GetUserInfoRequest, Options } from '../types';
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
        const loginRes = await directLogin({ unionId: userRes.list[0].unionId, platform: ptMap[platform] });
        if (!loginRes.accountShop) {
            throw new Error('获取门店信息失败');
        }
        let platformKey = '';
        if (options.platform === 'meituan') {
            platformKey = '8';
        } else if (options.platform === 'taobao') {
            platformKey = '11';
        } else if (options.platform === 'jingdong') {
            platformKey = '4';
        } else {
            throw new Error('不支持的平台');
        }
        logger.info(`门店名称：${loginRes.accountShop.shopName}`);
        const { origin } = await readSecret((db) => db.oa.zdb);
        return `${origin}#/login?token=${loginRes.accountShopToken}&platform=${platformKey}`;
    }

    async getUserInfo(params: GetUserInfoRequest): Promise<any> {
        return params.token;
    }
    getToken(url: string): string {
        const { hash } = new URL(url);
        const obj = qs.parse(hash.replace(`#/login?`, '')) as {
            token: string;
        };
        return obj.token;
    }
}
