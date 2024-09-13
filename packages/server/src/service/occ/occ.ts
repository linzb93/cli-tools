import open from "open";
import clipboard from "clipboardy";
import BaseCommand from "@/common/BaseCommand";
import sql from "@/common/sql";
import { showWeakenTips } from "@/common/helper";
import { sleep } from "@linzb93/utils";
import { Mtjysq, Mtzxsq, Mtpjsq, Mtimsq, Mtyxsq, Mtaibdsq, Mtdjds, Elejysq, Chain, Outer } from './apps';
import BaseApp from './apps/base'
import { getUserList, getShopUrl } from "@/model/http/occ";


export interface Options {
  /**
   * 是否只获取token，默认是打开网页
   */
  token: string | boolean;
  /**
   * 是否打开PC端网页，默认打开的是移动端网页
   */
  pc: boolean;
  /**
   * 是否复制店铺完整地址（含未处理的token）
   */
  copy: boolean;
  /**
   * 是否在获取地址后调用user api获取用户信息
   */
  user: boolean;
  /**
   * 是否打开测试站网址，或者复制测试站的token
   */
  test: boolean;
  /**
   * 查看帮助文档
   */
  help: boolean;
}

type AppCtor = new () => BaseApp;

export default class extends BaseCommand {
  private apps: AppCtor[] = [];
  private options: Options;
  /**
   * 当前匹配的应用
   */
  private currentApp: BaseApp;
  /**
   * 从输入中获取的应用名称
   */
  private appName = '';
  /**
   * 搜索内容，支持门店ID或门店名称关键字
   */
  private searchKeyword = '';
  async main(input: string[], options: Options) {
    this.options = options;
    this.setArgs(input);
    this.registerApp(Mtjysq);
    this.registerApp(Mtzxsq);
    this.registerApp(Mtpjsq);
    this.registerApp(Mtimsq);
    this.registerApp(Mtyxsq);
    this.registerApp(Mtdjds);
    this.registerApp(Mtaibdsq);
    this.registerApp(Elejysq);
    this.registerApp(Chain);
    this.registerApp(Outer);
    await this.run();
  }
  registerApp(app: AppCtor) {
    this.apps.push(app);
  }
  private async run() {
    this.setMachApp();
    const url = await this.search();
  }
  private setArgs(input: string[]) {
    if (!input.length) {
      return;
    }
    if (input.length === 2) {
      this.appName = input[0];
      this.searchKeyword = input[1];
      return;
    }
    if (input.length === 1) {
      if (/^[a-z]+$/.test(input[0])) {
        this.appName = input[0];
        // searchKeyword 用App里面的默认ID
      } else {
        this.appName = 'jysq';
        this.searchKeyword = input[0];
      }
    }
  }
  private setMachApp() {
    for (const app of this.apps) {
      if (app.name === this.appName) {
        this.currentApp = new app();
        break;
      }
    }
  }
  private async search() {
    // try {

    //   await getUserList(this.currentApp.url.list, {

    //   });
    // } catch (error) {

    // }
    let url = '';
    try {
      url = await getShopUrl(this.currentApp.url.login, this.currentApp.getLoginQuery({
        memberId: this.searchKeyword,
      }, this.currentApp));
    } catch (error) {
      return;
    }
    await this.afterSearch(url, this.searchKeyword);
  }
  private async afterSearch(url: string, shopName: string) {
    const { options } = this;
    if (options.token) {
      // 读取token
      const token = this.getToken(url);
      clipboard.writeSync(token);
      this.spinner.succeed(
        `【${this.currentApp.serviceName}】已复制店铺【${shopName}】 的token\n${token}`
      );
      return;
    } 
    if (options.copy) {
      // 复制店铺入口地址
      clipboard.writeSync(url);
      this.spinner.succeed(
        `【${this.currentApp.serviceName}】已复制店铺【${shopName}】的地址:\n${url}`
      );
      return;
    }
    if (options.user) {
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
      return;
    }
    const newUrl =
        typeof this.currentApp.getOpenUrl === "function"
          ? this.currentApp.getOpenUrl(shopResult)
          : url;
          if (
            this.currentApp.hasPC
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