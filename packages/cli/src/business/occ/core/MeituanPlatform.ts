import { BasePlatform } from './BasePlatform';
import { Options, GetUserInfoRequest } from '../types';
import { getMeituanShopURL, getUserInfo } from '../repository/meituan';
import { openPC } from '../helpers/occUtils';
export abstract class MeituanPlatform extends BasePlatform {
    platform = 8;
    async getShopUrl(keyword: string, options: Options): Promise<string> {
        return getMeituanShopURL(
            {
                appKey: this.appKey,
                memberId: keyword,
                platform: this.platform,
            },
            options.test,
        );
    }
    async getUserInfo(params: GetUserInfoRequest): Promise<any> {
        return getUserInfo(params);
    }
    openPC(url: string, shopName: string) {
        openPC({ url, serviceName: this.serviceName, shopName });
    }
}
