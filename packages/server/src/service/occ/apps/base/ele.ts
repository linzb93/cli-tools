import {getEleShopUrl, getEleShopList,getEleUserInfo} from '@/model/http/occ';
import Base from "./";
export default abstract class Ele extends Base {
  /**
   * appKey，各应用不一样
   */
  abstract appKey: string;
  /**
   * 平台值
   */
  platform = 11;
  searchKey = '';
  async getShopUrl(keyword: string, isTest: boolean): Promise<string> {
    return getEleShopList({
      appId: this.appKey,
      platform: this.platform,
    },isTest)
    .then((res) => {
      return  getEleShopUrl({
        appId: this.appKey,
        shopId: keyword,
        userId: res.list[0].userId
      }, isTest)
    });
  }
  async getUserInfo(token: string, isTest: boolean): Promise<string> {
    return getEleUserInfo(token, isTest);
  }
}
