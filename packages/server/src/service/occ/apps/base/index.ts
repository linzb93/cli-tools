import { App } from "../../types";

export default abstract class {
  /**
   * 名称（缩写）
   */
  abstract name: string;
  /**
   * 应用名称（中文）
   */
  abstract serviceName: string;
  /**
   * appKey，各应用不一样
   */
  abstract appKey: string;
  /**
   * （正式站）当没有传入查询ID时，使用的默认ID，一般是测试账号
   */
  abstract defaultId: string;
  /**
   * （测试站）当没有传入查询ID时，使用的默认ID，一般是测试账号
   */
  abstract testDefaultId: string;
  /**
   * 平台值
   */
  abstract platform: number;
  abstract searchKey: string;
  /**
   * 各类URL
   */
  abstract url: {
    base: string;
    list: string;
    login: string;
    user?: string;
  };
  abstract getFindQuery(app: App): any
  abstract getLoginQuery(item: any, app: App): any
  /**
   * 获取店铺名称，如果不存在的话获取店铺ID
   */
  abstract getShopName(shop: any): string
}