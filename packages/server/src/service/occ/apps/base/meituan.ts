import { App } from "../../types";
import Base from './';
export default abstract class Meituan extends Base {
  /**
   * 名称（缩写）
   */
  abstract name:string;
  /**
   * 平台值
   */
  platform = 8;
  searchKey = "param";
  /**
   * 各类URL
   */
  url = {
    base: "/",
    list: "/occ/order/getOrderInfoList",
    login: "/occ/order/replaceUserLogin",
    userApi: "/meituan/homeUserInfo",
  };
  getFindQuery(app: App) {
    return {
      appKey: app.appKey,
      platform: app.platform,
      serviceName: app.serviceName,
    };
  }
  getLoginQuery(item: any, app: App) {
    return {
      appKey: app.appKey,
      memberId: item.memberId,
      platform: app.platform,
    };
  }
  getShopName(shop: any) {
    return shop.memberName || shop.memberId;
  }
}