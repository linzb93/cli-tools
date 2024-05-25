import ls from "@/util/ls";
import { App } from "./types";

const meituanParams = {
  platform: 8,
  searchKey: "param",
  url: {
    base: "/",
    list: "/occ/order/getOrderInfoList",
    login: "/occ/order/replaceUserLogin",
    userApi: "/meituan/home",
  },
  getFindQuery(app: App) {
    return {
      appKey: app.appKey,
      platform: app.platform,
      serviceName: app.serviceName,
    };
  },
  getFindResult(res: any) {
    return {};
  },
  getLoginQuery(item: any) {
    return {
      appKey: item.appKey,
      memberId: item.memberId,
      platform: item.platform,
    };
  },
  getShopName(shop: any) {
    return shop.memberName || shop.memberId;
  },
};
const eleFn = {
  url: {
    base: "/eleOcc",
    list: "/manage/getOrderList",
    login: "/auth/onelogin",
    userApi: "/home/getUserInfo",
  },
  getFindQuery(app: App) {
    return {
      appId: app.appId,
      platform: app.platform,
      serviceName: app.serviceName,
    };
  },
  getFindResult(res: any) {
    return {};
  },
  getLoginQuery(item: any) {
    return {
      appId: item.appId,
      shopId: item.shopId,
      userId: item.userId,
    };
  },
  getShopName(shop: any) {
    return shop.shopName || shop.shopId;
  },
};

const appMap: App[] = [
  {
    name: "jysq",
    appKey: "4",
    serviceName: "经营神器-美团",
    defaultId: "15983528161",
    ...meituanParams,
  },
  {
    name: "zx",
    appKey: "36",
    serviceName: "装修神器-美团",
    defaultId: "16159400501",
    ...meituanParams,
  },
  {
    name: "pj",
    appKey: "73",
    serviceName: "评价神器-美团",
    defaultId: "16499283381",
    ...meituanParams,
  },
  {
    name: "im",
    appKey: "75",
    serviceName: "IM神器-美团",
    defaultId: "16505256214",
    ...meituanParams,
  },
  {
    name: "yx",
    appKey: "76",
    serviceName: "营销神器-美团",
    defaultId: "16505284824",
    ...meituanParams,
  },
  {
    name: "dj",
    appKey: "85",
    serviceName: "点金大师-美团",
    defaultId: "16668523733",
    ...meituanParams,
  },
  {
    name: "ai",
    appKey: "106",
    serviceName: "AI爆单神器-美团",
    platform: 8,
    searchKey: "param",
    defaultId: "16928614773",
    ...meituanParams,
  },
  {
    name: "ele",
    appId: "29665924",
    serviceName: "店客多-饿了么经营神器",
    platform: 11,
    searchKey: "param",
    defaultId: "160276429",
    testDefaultId: "500822668",
    ...eleFn,
  },
  {
    name: "chain",
    searchKey: "searchParam",
    serviceName: "店客多品牌连锁",
    defaultId: "15859095882",
    prefix: ls.get("oa.oldApiPrefix"),
    url: {
      base: "/chain/occ",
      list: "/oa/dkdAccountDetails/accountAnalysisList",
      login: "/dkdAccount/oa/getAccountToken",
    },
    getFindQuery(app: App) {
      return {
        sort: "",
        sortType: "",
      };
    },
    getFindResult(res: any) {
      return {};
    },
    getLoginQuery(item: any) {
      return {
        id: item.dkdAccountInfo.id,
      };
    },
    getShopName(shop: any) {
      return shop.dkdAccountInfo.brandName;
    },
    getToken(result) {
      return result.token;
    },
  },
  {
    name: "outer",
    appKey: "5",
    serviceName: "经营神器-美团",
    defaultId: "15983528161",
    ...meituanParams,
  },
];
export default appMap;
