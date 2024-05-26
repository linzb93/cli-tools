import { AnyObject } from "@/util/types";

export interface App {
  name: string;
  serviceName?: string;
  appKey?: string;
  searchKey: string;
  platform?: number;
  appId?: string;
  prefix?: string;
  defaultId: string;
  testDefaultId?: string;
  needGetList?: boolean; // 必须先获取列表再获取token
  url: {
    base: string;
    list: string;
    login: string;
    userApi?: string;
  };
  getFindQuery: (app: App) => AnyObject;
  getLoginQuery: (data: any, app: App) => AnyObject;
  getShopName: (shop: any) => string;
  getToken?: (result: any) => string;
}
