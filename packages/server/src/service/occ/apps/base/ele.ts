import { App } from "../../types";
import Base from './';
export default abstract class Ele extends Base {
  /**
   * 名称（缩写）
   */
  abstract name:string;
  /**
   * 平台值
   */
  platform = 8;
  needGetList = true;
  searchKey = "param";
  /**
   * 各类URL
   */
  url = {
    base: "/eleOcc",
    list: "/manage/getOrderList",
    login: "/auth/onelogin",
    userApi: "/home/getUserInfo",
  };
  getFindQuery(app: App) {
    return {
      appId: app.appId,
      platform: app.platform,
      serviceName: app.serviceName,
    };
  }
  getLoginQuery(item: any, app: App) {
    return {
      appId: item.appId,
      shopId: item.shopId,
      userId: item.userId,
    };
  }
  getShopName(shop: any) {
    return shop.shopName || shop.shopId;
  }
}