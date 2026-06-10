import { BasePlatform } from './BasePlatform';
import { Options, GetUserInfoRequest } from '../types';
import { getTaobaoShopURL, getTaobaoShopList, getTaobaoUserInfo } from '../repository/taobao';

export abstract class TaobaoPlatform extends BasePlatform {
    platform = 11;
    async getShopUrl(keyword: string, options: Pick<Options, 'test'>): Promise<string> {
        const res = await getTaobaoShopList(
            {
                appId: this.appKey,
                param: keyword,
                serviceName: '店客多-饿了么经营神器',
            },
            options.test,
        );
        const list = res.list || [];
        if (!list.length) {
            throw new Error('淘宝店铺不存在');
        }
        return getTaobaoShopURL(
            {
                appId: this.appKey,
                shopId: list[0].shopId,
                userId: list[0].userId,
            },
            options.test,
        );
    }
    async getUserInfo(params: GetUserInfoRequest): Promise<any> {
        return getTaobaoUserInfo(params);
    }
}
