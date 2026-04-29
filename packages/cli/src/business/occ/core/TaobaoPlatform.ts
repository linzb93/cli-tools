import { BasePlatform } from './BasePlatform';
import { Options } from '../types';
import { getEleShopUrl, getEleUserInfo } from '../repository/taobao';

export abstract class TaobaoPlatform extends BasePlatform {
    platform = 11;
    async getShopUrl(keyword: string, options: Options): Promise<string> {
        return getEleShopUrl(
            {
                appKey: this.appKey,
                memberId: keyword,
                platform: this.platform,
            },
            options.test,
        );
    }
    async getUserInfo(token: string, userApi: string, isTest: boolean): Promise<any> {
        return getEleUserInfo(token, userApi, isTest);
    }
}
