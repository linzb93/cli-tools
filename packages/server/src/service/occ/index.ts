import axios, { AxiosInstance } from "axios";
import open from "open";
import clipboard from "clipboardy";
import BaseCommand from "@/common/BaseCommand";
import appMap from "./appMap";
import { App } from "./types";
import sql from "@/common/sql";
import { AnyObject } from "@/typings";
import ls from "@/common/ls";
import {showWeakenTips} from "@/common/helper";
import { sleep } from "@linzb93/utils";
export interface Options {
  token: string | boolean;
  pc: boolean;
  copy: boolean;
  full: boolean;
  user: boolean;
  test: boolean;
  help: boolean;
}
/**
 * OCC管理
 */
export default class extends BaseCommand {
  private currentApp: App;
  private memberId: string = "";
  private service: AxiosInstance;
  private options: Options;
  private input: string[];
  constructor() {
    super();
  }
  async main(input: string[], options: Options) {
    this.options = options;
    this.input = input;
    this.setMatchApp();
    const { shop, url, shopResult } = await this.getShop();
    const shopName = this.currentApp.getShopName(shop);
    if (options.token) {
      // 读取token
      const token = this.getToken(url);
      clipboard.writeSync(token);
      this.spinner.succeed(
        `【${this.currentApp.serviceName}】已复制店铺【${shopName}】 的token\n${token}`
      );
    } else if (options.copy) {
      // 复制店铺入口地址
      clipboard.writeSync(url);
      this.spinner.succeed(
        `【${this.currentApp.serviceName}】已复制店铺【${shopName}】的地址:\n${url}`
      );
    } else if (options.user) {
      // 获取店铺的用户信息
      const token = this.getToken(url);
      this.spinner.text = "正在获取用户信息";
      const prefix = await sql((db) => db.oa.userApiPrefix);
      const { data } = await axios.post(
        prefix + this.currentApp.url.userApi,
        {},
        {
          headers: {
            token,
          },
        }
      );
      this.spinner.succeed(`获取店铺【${shopName}】信息成功!`);
      console.log(data.result);
    } else {
      const newUrl =
        typeof this.currentApp.getOpenUrl === "function"
          ? this.currentApp.getOpenUrl(shopResult)
          : url;
      if (
        options.pc &&
        ["4", "73", "36", "75"].includes(this.currentApp.appKey)
      ) {
        // 只有美团经营神器、装修神器、评价神器和IM神器有PC端
        open(newUrl.replace("app", ""));
      } else {
        open(newUrl);
      }
      this.spinner.succeed(
        `【${this.currentApp.serviceName}】店铺【${shopName}】打开成功`
      );
    }
  }
  /**
   * 获取店铺搜索列表
   * @param pageSize
   * @returns
   */
  private async getSearchList(): Promise<any[]> {
    this.spinner.text = `【${this.currentApp.serviceName}】正在获取店铺信息`;
    const { service, memberId, currentApp } = this;
    const listSearchParams = {
      ...this.currentApp.getFindQuery(this.currentApp),
      pageIndex: 1,
      pageSize: 1,
      [this.currentApp.searchKey]: memberId,
    };
    let listData: {
      result: {
        list: AnyObject[];
      };
    };
    try {
      const res = await service.post(currentApp.url.list, listSearchParams, {});
      listData = res.data;
    } catch (error) {
      this.spinner.fail(
        showWeakenTips(
          "服务器故障，请稍后再试。",
          (error as Error).message
        )
      );
      process.exit(1);
    }
    if (!listData.result) {
      this.spinner.fail(
        showWeakenTips(
          "服务器故障，请稍后再试。",
          JSON.stringify(listData)
        ),
        true
      );
    } else if (!listData.result.list.length) {
      this.spinner.fail("未找到店铺", true);
    }
    return listData.result.list;
  }
  private async getShop(): Promise<{
    shop: AnyObject;
    url: string;
    shopResult: any;
  }> {
    const { options, currentApp } = this;
    let shop = {};
    let shopName = "";
    if (options.full || currentApp.needGetList) {
      const list = await this.getSearchList();
      shop = list[0];
      shopName = this.currentApp.getShopName(list[0]);
    } else {
      shop = {
        memberId: this.memberId,
      };
      shopName = this.memberId;
    }
    if (options.token) {
      this.spinner.text = `【${currentApp.serviceName}】正在获取token:${shopName}`;
    } else {
      this.spinner.text = `【${currentApp.serviceName}】正在获取店铺信息:${shopName}`;
    }
    await sleep(1500);
    const {
      data: { result },
    } = await this.service.post(
      currentApp.url.login,
      currentApp.getLoginQuery(shop, currentApp)
    );
    return {
      shopResult: result,
      url:
        typeof currentApp.getToken === "function"
          ? currentApp.getToken(result)
          : result,
      shop,
    };
  }
  /**
   * 根据命令行入参判断是要读取哪个app的
   */
  private setMatchApp() {
    const { input } = this;
    let match: App;
    let memberId = "";
    if (!input.length) {
      match = appMap.find((app) => app.name === "jysq");
      memberId = !this.options.test ? match.defaultId : match.testDefaultId;
    } else if (input.length === 1) {
      if (isNaN(Number(input[0]))) {
        match = appMap.find((app) => app.name === input[0]);
        if (!match) {
          throw new Error("项目不存在，请重新输入");
        }
        memberId = !this.options.test ? match.defaultId : match.testDefaultId;
      } else {
        match = appMap.find((app) => app.name === "jysq");
        memberId = input[0];
      }
    } else if (input.length === 2) {
      match = appMap.find((app) => app.name === input[0]);
      if (!match) {
        throw new Error("项目不存在，请重新输入");
      }
      memberId = input[1];
    }
    this.currentApp = match;
    this.memberId = memberId;
    const baseURL = (() => {
      if (match.prefix) {
        return `${match.prefix}${match.url.base}`;
      }
      return `${
        this.options.test ? ls.get("oa.testPrefix") : ls.get("oa.apiPrefix")
      }${match.url.base}`;
    })();
    this.service = axios.create({
      baseURL,
    });
  }
  /**
   * 根据应用登录页地址获取token
   * @param url 应用入口，登录页
   * @returns {string} token
   */
  private getToken(url: string): string {
    if (!url.startsWith("http")) {
      return url;
    }
    const { hash } = new URL(url);
    const fullToken = hash.replace("#/login?code=", "");
    return fullToken.replace(/occ_(senior_)?/, "").replace(/&.+/, "");
  }
}
