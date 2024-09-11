import { App } from "../../types";
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
