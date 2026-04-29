import { BasePlatform } from './BasePlatform';
import { Options } from '../types';
import { getMeituanShopUrl, getUserInfo } from '../repository/meituan';
import { openPC } from '../helpers/occUtils';
export abstract class MeituanPlatform extends BasePlatform {
    platform = 8;
    async getShopUrl(keyword: string, options: Options): Promise<string> {
        return getMeituanShopUrl(
            {
                appKey: this.appKey,
                memberId: keyword,
                platform: this.platform,
            },
            options.test,
        );
    }
    async getUserInfo(token: string, userApi: string, isTest: boolean): Promise<any> {
        return getUserInfo(token, userApi, isTest);
    }
    openPC(url: string, shopName: string) {
        openPC({ url, serviceName: this.serviceName, shopName });
    }
}
