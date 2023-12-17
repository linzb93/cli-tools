import axios, { AxiosInstance } from 'axios';
import open from 'open';
import clipboard from 'clipboardy';
import BaseCommand from '../../util/BaseCommand.js';
import login from './login.js';
import { stringify } from 'querystring';
import chalk from 'chalk';
import map from './map.js';
import { MeituanLoginParams, EleLoginParams } from './types';
import { AnyObject } from '../../util/types.js';
interface Options {
  token: string | boolean;
  pc: boolean;
  copy: boolean;
  test: boolean;
  user: boolean;
  /**
   * 如何获取豪华版（2）
   * 获取最近10条累积消费在200元以上的高级版用户，
   * 每一条查询是否是豪华版。将获取到的用户ID写入存储，
   * 下次直接调用，在此之前检查是否还是豪华版，如果不是，就删除，重复上面的操作
   */
  version: '0' | '1' | '2';
}
interface ShopItem extends MeituanLoginParams, EleLoginParams {
  memeberName?: string;
  shopName?: string;
  startTime: string;
  endTime: string;
  price: string;
}
interface ShopListResponse {
  result: {
    list: ShopItem[];
  };
  code: number;
}
class OCC extends BaseCommand {
  private input: string[];
  private options: Options;
  private currentApp: any;
  private shopId: any;
  private service: AxiosInstance;
  constructor(input: string[], options: Options) {
    super();
    this.input = input;
    this.options = options;
    this.service = axios.create({
      baseURL: ''
    });
  }
  async run() {
    const { options } = this;
    this.setMatchProject();
    if (this.currentApp.name === 'chain') {
      this.handleChainProject();
      return;
    }
    if (this.currentApp.name === 'sg') {
      this.handleSgProject();
      return;
    }
    if (options.version === '2') {
      await this.getLuxuryShop();
      return;
    }
    const { shop, url } = await this.getShop();
    if (options.token === true) {
      // token无输入值，就只是复制token
      const { hash } = new URL(url);
      const fullToken = hash.replace('#/login?code=', '');
      const token = fullToken.replace(/occ_(senior_)?/, '').replace(/&.+/, '');
      clipboard.writeSync(token);
      this.spinner.succeed(
        `【${this.currentApp.serviceName}】已复制店铺 ${
          shop.shopName || shop.shopId
        } 的token\n${token}`
      );
    } else if (options.token) {
      // token有值，就是根据token登录
      const { origin, pathname } = new URL(url);
      this.spinner.succeed('打开成功');
      open(`${origin}${pathname}#/login?code=${options.token}`);
    } else if (options.copy) {
      clipboard.writeSync(url);
      this.spinner.succeed(
        `【${this.currentApp.serviceName}】已复制店铺 ${
          shop.shopName || shop.shopId
        } 的地址`
      );
    } else if (options.user) {
      const { hash } = new URL(url);
      const token = hash.replace('#/login?code=', '');
      this.spinner.text = '正在获取用户信息';
      const { data } = await axios.post(
        this.ls.get('oa.userApiPrefix') + this.currentApp.url.userApi,
        {},
        {
          headers: {
            token
          }
        }
      );
      this.spinner.succeed(`获取店铺 ${shop.shopName || shop.shopId} 信息成功`);
      console.log(data.result);
    } else {
      if (
        options.pc &&
        ['4', '73', '36', '75'].includes(this.currentApp.appKey)
      ) {
        // 只有美团经营神器、装修神器、评价神器和IM神器有PC端
        open(url.replace('app', ''));
      } else {
        open(url);
      }
      this.spinner.succeed(
        `【${this.currentApp.serviceName}】店铺 ${
          shop.shopName || shop.shopId
        } 打开成功`
      );
    }
  }
  private async getSearchList(pageSize = 1): Promise<any[]> {
    const { options, service, shopId, currentApp: match } = this;
    const listSearchParams = {
      // @ts-ignore
      [match.appKeyName]: match[match.appKeyName],
      pageIndex: 1,
      pageSize,
      param: shopId,
      platform: match.platform,
      version: 1,
      minPrice: options.version === '2' ? 200 : 0,
      serviceName: match.serviceName
    };
    let listData: ShopListResponse;
    this.logger.debug(listSearchParams);
    try {
      const res = await service.post(match.url.list, listSearchParams);
      listData = res.data;
    } catch (error) {
      this.spinner.fail(
        this.helper.showWeakenTips(
          '服务器故障，请稍后再试。',
          (error as Error).message
        )
      );
      process.exit(1);
    }
    if (listData.code === 401) {
      await login(options.test);
      return await this.getSearchList();
    } else if (!listData.result) {
      this.spinner.fail(
        this.helper.showWeakenTips(
          '服务器故障，请稍后再试。',
          JSON.stringify(listData)
        )
      );
    } else if (!listData.result.list.length) {
      this.logger.debug(listData);
      this.spinner.fail('未找到店铺', true);
    }
    return listData.result.list;
  }
  private setMatchProject(): void {
    const { input, options } = this;
    let match = {} as typeof map.default;
    let shopId = '';
    this.spinner.text = '正在搜索店铺';
    if (input.length === 0) {
      match = map.default;
      shopId = match.testId;
    } else if (input.length === 1) {
      if (isNaN(Number(input[0])) && this.helper.isValidKey(input[0], map)) {
        match = map[input[0]];
        if (!match) {
          this.spinner.fail('项目不存在，请重新输入', true);
        }
        shopId = match.testId;
      } else {
        match = map.default;
        shopId = input[0];
      }
    } else if (input.length === 2) {
      if (isNaN(Number(input[0])) && this.helper.isValidKey(input[0], map)) {
        match = map[input[0]];
        if (!match) {
          this.spinner.fail('项目不存在，请重新输入', true);
        }
        shopId = input[1];
      } else if (this.helper.isValidKey(input[1], map)) {
        match = map[input[1]];
        if (!match) {
          this.spinner.fail('项目不存在，请重新输入', true);
        }
        shopId = input[0];
      }
    }
    this.currentApp = match;
    this.shopId = shopId;
    this.service = axios.create({
      baseURL: `${
        options.test
          ? this.ls.get('oa.testPrefix')
          : this.ls.get('oa.apiPrefix')
      }${match.url.base}`,
      headers: {
        token: this.ls.get(options.test ? 'oa.testToken' : 'oa.token')
      }
    });
  }
  private async getShop(): Promise<{
    shop: ShopItem;
    url: string;
  }> {
    const { options, currentApp: match } = this;
    const list = await this.getSearchList();
    const shop = list[0] as ShopItem;
    if (options.token === true) {
      this.spinner.text = `【${match.serviceName}】正在获取token:${
        shop.shopName || shop.shopId
      }`;
    } else if (!options.token) {
      this.spinner.text = `【${match.serviceName}】正在获取token:${
        shop.shopName || shop.shopId
      }`;
    }
    await this.helper.sleep(1500);
    const {
      data: { result }
    } = await this.service.post(match.url.login, match.loginKey(shop), {
      headers: {
        token: this.ls.get(options.test ? 'oa.testToken' : 'oa.token')
      }
    });
    return {
      url: result,
      shop
    };
  }
  private async getLuxuryShop() {
    const { options } = this;
    const luxuryShop = this.ls.get('oa.luxury');
    const { is, token, url } = await this.isLuxuryShop(luxuryShop);
    if (is) {
      if (options.token === true) {
        clipboard.writeSync(token);
        this.spinner.succeed(
          `【${this.currentApp.serviceName}】已复制店铺 ${
            luxuryShop.shopName || luxuryShop.shopId
          } 的token\n${token}`
        );
      } else {
        this.spinner.succeed('打开成功');
        open(url);
      }
      return;
    }
    const shops = await this.getSearchList(10);
    for (const shop of shops) {
      const url = await this.getShopUrl(shop);
      const { hash } = new URL(url);
      const fullToken = hash.replace('#/login?code=', '');
      const userInfo = await this.getUserInfo(fullToken, shop);
      if (userInfo.versionPlus === 1) {
        this.ls.set('oa.luxury', shop);
        return;
      }
    }
  }
  private async isLuxuryShop(shop: any): Promise<AnyObject> {
    const url = await this.getShopUrl(shop);
    const { hash } = new URL(url);
    const fullToken = hash.replace('#/login?code=', '');
    const userInfo = await this.getUserInfo(fullToken, shop);
    return {
      is: userInfo.versionPlus === 1,
      url,
      token: fullToken
    };
  }
  private async getShopUrl(shop: any) {
    const { currentApp: match, options } = this;
    const {
      data: { result }
    } = await this.service.post(match.url.login, match.loginKey(shop), {
      headers: {
        token: this.ls.get(options.test ? 'oa.testToken' : 'oa.token')
      }
    });
    return result;
  }
  private async getUserInfo(token: string, shop: any): Promise<any> {
    const match = this.currentApp;
    const { data } = await axios.post(
      this.ls.get('oa.userApiPrefix') + match.url.userApi,
      {},
      {
        headers: {
          token
        }
      }
    );
    this.spinner.succeed(`获取店铺 ${shop.shopName || shop.shopId} 信息成功`);
    console.log(data.result);
  }
  private async handleChainProject() {
    const match = this.currentApp;
    const { shopId } = this;
    this.logger.debug(`shopId:${shopId}`);
    const { options } = this;
    axios
      .post(
        `${this.ls.get('oa.oldApiPrefix')}/chain/occ/dkdAccount/oa/listAccount`,
        {
          searchParam: shopId || match.testId,
          accountStatus: '',
          pageSize: 1,
          pageIndex: 1
        }
      )
      .then((response) => {
        const target = response.data.result.list[0];
        if (!target) {
          this.spinner.fail('店铺不存在', true);
        }
        return Promise.all([
          axios.post(
            `${this.ls.get(
              'oa.oldApiPrefix'
            )}/chain/occ/dkdAccount/oa/getAccountToken`,
            {
              id: target.id
            }
          ),
          Promise.resolve(target.brandName)
        ]);
      })
      .then(([response, brandName]) => {
        const { token, createTime, phoneNumber, id, shopNumber } =
          response.data.result;

        if (options.token) {
          this.spinner.succeed(
            `【连锁品牌】已复制账号${chalk.yellow(
              `【${brandName}】`
            )}token：\n${token}`
          );
          clipboard.writeSync(token);
        } else {
          this.spinner.succeed(
            `【连锁品牌】正在打开${chalk.yellow(`【${brandName}】`)}的管理后台`
          );
          open(
            `https://ka.diankeduo.net/#/loginByOa?${stringify({
              token,
              createTime,
              phoneNumber,
              id,
              shopNumber
            })}`
          );
        }
      })
      .catch((e) => {
        this.spinner.fail((e as Error).message);
      });
  }
  private async handleSgProject() {
    const match = this.currentApp;
    const { shopId } = this;
    this.logger.debug(`shopId:${shopId}`);
    const { options } = this;
    const token = this.ls.get('oa.token');
    const response = await axios.post(
      `${this.ls.get('oa.apiPrefix')}/retailManage/pageQueryOccOrder`,
      {
        queryParam: shopId || match.testId,
        pageSize: 1,
        pageIndex: 1
      },
      {
        headers: {
          token
        }
      }
    );
    if (response.data.code === 401) {
      await login(options.test);
      return await this.handleChainProject();
    }
    const target = response.data.result.list[0];
    if (!target) {
      this.spinner.fail('店铺不存在', true);
    }
    const tokenResponse = await axios.post(
      `${this.ls.get('oa.apiPrefix')}/retailManage/getShopTokenToUse`,
      {
        shopId: target.shopId,
        appKey: match.appKey
      },
      {
        headers: {
          token
        }
      }
    );
    const { occToken } = tokenResponse.data.result;

    if (options.token) {
      this.spinner.succeed(
        `【美团闪购】已复制账号${chalk.yellow(
          `【${target.shopName}】`
        )}token：\n${occToken}`
      );
      clipboard.writeSync(occToken);
    } else {
      this.spinner.succeed(
        `【美团闪购】正在打开${chalk.yellow(`【${target.shopName}】`)}的店铺`
      );
      open(`${match.url}login?code=${occToken}`);
    }
  }
}

export default (input: string[], options: Options) => {
  new OCC(input, options).run();
};
