import { AnyObject } from "@/util/types";
export interface MeituanLoginParams {
  appKey: string;
  shopId?: string;
  memberId?: string;
  platform: number;
}
export interface EleLoginParams {
  shopId?: string;
  shopName?: string;
  memberId?: string;
  userId: string;
}
export interface ShopItem extends MeituanLoginParams, EleLoginParams {
  memberName?: string;
  shopName?: string;
  startTime: string;
  endTime: string;
  price: string;
}

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
  url: {
    base: string;
    list: string;
    login: string;
    userApi?: string;
  };
  getFindQuery: (app: App) => AnyObject;
  getFindResult: (res: any) => AnyObject;
  getLoginQuery: (data: any) => AnyObject;
  getShopName: (shop: any) => string;
  getToken?: (result: any) => string;
}
