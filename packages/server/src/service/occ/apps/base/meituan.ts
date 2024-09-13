import Base from "./";
import {getMeituanShopUrl,getMeituanUserInfo} from '@/model/http/occ';
export default abstract class Meituan extends Base {
  /**
   * appKey，各应用不一样
   */
  abstract appKey: string;
  /**
   * 平台值
   */
  platform = 8;
  searchKey = "param";
  async getShopUrl(keyword: string, isTest: boolean): Promise<string> {
    return getMeituanShopUrl({
      appKey: this.appKey,
      memberId: keyword,
      platform: this.platform,
    }, isTest);
  }
  async getUserInfo(token: string, isTest: boolean): Promise<string> {
    return getMeituanUserInfo(token, isTest);
  }
}
