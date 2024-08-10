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
  getLoginQuery(item: any, app: App) {
    return {
      appKey: app.appKey,
      memberId: item.memberId,
      platform: app.platform,
    };
  },
  getShopName(shop: any) {
    return shop.memberName || shop.memberId;
  },
};
const eleFn = {
  needGetList: true,
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
  getLoginQuery(item: any, app: App) {
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
    testDefaultId: '15983528161',
    ...meituanParams,
  },
  {
    name: "zx",
    appKey: "36",
    serviceName: "装修神器-美团",
    defaultId: "16159400501",
    testDefaultId: "16159400501",
    ...meituanParams,
  },
  {
    name: "pj",
    appKey: "73",
    serviceName: "评价神器-美团",
    defaultId: "16499283381",
    testDefaultId:"16499283381",
    ...meituanParams,
  },
  {
    name: "im",
    appKey: "75",
    serviceName: "IM神器-美团",
    defaultId: "16505256214",
    testDefaultId: "16505256214",
    ...meituanParams,
  },
  {
    name: "yx",
    appKey: "76",
    serviceName: "营销神器-美团",
    defaultId: "16505284824",
    testDefaultId: "16505284824",
    ...meituanParams,
  },
  {
    name: "dj",
    appKey: "85",
    serviceName: "点金大师-美团",
    defaultId: "16668523733",
    testDefaultId:"16668523733",
    ...meituanParams,
  },
  {
    name: "ai",
    appKey: "106",
    serviceName: "AI爆单神器-美团",
    platform: 8,
    searchKey: "param",
    defaultId: "16928614773",
    testDefaultId:"16928614773",
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
    defaultId: "13023942325",
    prefix: ls.get("oa.oldApiPrefix"),
    needGetList: true,
    url: {
      base: "/chain/occ",
      list: "/oa/dkdAccountDetails/accountAnalysisList",
      login: "/dkdAccount/oa/getAccountToken",
    },
    getFindQuery(_: App) {
      return {
        sort: "",
        sortType: "",
      };
    },
    getLoginQuery(item: any, _: App) {
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
    getOpenUrl(res) {
      return `https://ka.diankeduo.net/#/loginByOa?createTime=${encodeURIComponent(
                            res.createTime
                        )}&id=${encodeURIComponent(res.id)}&phoneNumber=${encodeURIComponent(
                            res.phoneNumber
                        )}&shopNumber=${encodeURIComponent(res.shopNumber)}&token=${encodeURIComponent(res.token)}`
    }
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
