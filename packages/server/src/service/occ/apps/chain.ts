import sql from "@/common/sql";
import Base from "./base";

export default class extends Base {
  name = "chain";
  searchKey = "searchParam";
  serviceName = "店客多品牌连锁";
  defaultId = "13023942325";
  testDefaultId = "13023942325";
  prefix = "";
  url = {
    base: "/chain/occ",
    list: "/oa/dkdAccountDetails/accountAnalysisList",
    login: "/dkdAccount/oa/getAccountToken",
  };
  getFindQuery(_: any) {
    return {
      sort: "",
      sortType: "",
    };
  }
  getLoginQuery(item: any, _: any) {
    return {
      id: item.dkdAccountInfo.id,
    };
  }
  getShopName(shop: any) {
    return shop.dkdAccountInfo.brandName;
  }
  getToken(result: any) {
    return result.token;
  }
  getOpenUrl(res: any) {
    return `https://ka.diankeduo.net/#/loginByOa?createTime=${encodeURIComponent(
      res.createTime
    )}&id=${encodeURIComponent(res.id)}&phoneNumber=${encodeURIComponent(
      res.phoneNumber
    )}&shopNumber=${encodeURIComponent(
      res.shopNumber
    )}&token=${encodeURIComponent(res.token)}`;
  }
  constructor() {
    super();
    this.init();
  }

  private async init() {
    this.prefix = await sql((db) => db.oa.oldApiPrefix);
  }
}
