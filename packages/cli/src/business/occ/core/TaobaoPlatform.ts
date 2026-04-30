import { BasePlatform } from './BasePlatform';
import { Options, GetUserInfoRequest } from '../types';
import { getTaobaoShopURL, getTaobaoUserInfo } from '../repository/taobao';

export abstract class TaobaoPlatform extends BasePlatform {
    platform = 11;
    async getShopUrl(keyword: string, options: Options): Promise<string> {
        return getTaobaoShopURL(
            {
                appKey: this.appKey,
                memberId: keyword,
                platform: this.platform,
            },
            options.test,
        );
    }
    async getUserInfo(params: GetUserInfoRequest): Promise<any> {
        return getTaobaoUserInfo(params);
    }
}
