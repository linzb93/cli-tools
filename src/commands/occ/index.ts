import axios, { AxiosInstance } from 'axios';
import open from 'open';
import clipboard from 'clipboardy';
import BaseCommand from '../../util/BaseCommand.js';
import login from './login.js';
import { stringify } from 'querystring';
import chalk from 'chalk';
import map from './map.js';
import { MeituanLoginParams, EleLoginParams } from './types';
interface Options {
  token: string | boolean;
  pc: boolean;
  copy: boolean;
  user: boolean;
  test: boolean;
}
type App = typeof map.default;
interface ShopItem extends MeituanLoginParams, EleLoginParams {
  memberName?: string;
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
  private currentApp: App;
  private memberId: string;
  private service: AxiosInstance;
  constructor(input: string[], options: Options) {
    super();
    this.input = input;
    this.options = options;
    this.currentApp = map.default;
    this.memberId = '';
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
    const { shop, url } = await this.getShop();
    const shopName = (() => {
      if (this.currentApp.name === 'ele') {
        return shop.shopName || shop.shopId;
      }
      return shop.memberName || shop.memberId;
    })();
    if (options.token === true) {
      // token无输入值，就只是复制token
      const { hash } = new URL(url);
      const fullToken = hash.replace('#/login?code=', '');
      const token = fullToken.replace(/occ_(senior_)?/, '').replace(/&.+/, '');
      clipboard.writeSync(token);
      this.spinner.succeed(
        `【${this.currentApp.serviceName}】已复制店铺 ${shopName} 的token\n${token}`
      );
    } else if (options.token) {
      // token有值，就是根据token登录
      const { origin, pathname } = new URL(url);
      this.spinner.succeed('打开成功');
      open(`${origin}${pathname}#/login?code=${options.token}`);
    } else if (options.copy) {
      clipboard.writeSync(url);
      this.spinner.succeed(
        `【${this.currentApp.serviceName}】已复制店铺 ${shopName} 的地址:\n${url}`
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
      this.spinner.succeed(`获取店铺 ${shopName} 信息成功`);
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
      const shopName = (() => {
        if (this.currentApp.name === 'ele') {
          return shop.shopName || shop.shopId;
        }
        return shop.memberName || shop.memberId;
      })();

      this.spinner.succeed(
        `【${this.currentApp.serviceName}】店铺 ${shopName} 打开成功`
      );
    }
  }
  private async getSearchList(pageSize = 1): Promise<any[]> {
    const { service, memberId, currentApp: match } = this;
    const listSearchParams = {
      // @ts-ignore
      [match.appKeyName]: match[match.appKeyName],
      pageIndex: 1,
      pageSize,
      param: memberId,
      platform: match.platform,
      version: 1,
      minPrice: 0,
      serviceName: match.serviceName
    };
    let listData: ShopListResponse;
    this.logger.debug(listSearchParams);
    try {
      const res = await service.post(match.url.list, listSearchParams, {
        headers: {
          token: this.ls.get('oa.token')
        }
      });
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
      await login(this.options);
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
    const { input } = this;
    let match = {} as typeof map.default;
    let memberId = '';
    this.spinner.text = '正在搜索店铺';
    if (input.length === 0) {
      match = map.default;
      memberId = !this.options.test ? match.defaultId : match.testId;
    } else if (input.length === 1) {
      if (isNaN(Number(input[0])) && this.helper.isValidKey(input[0], map)) {
        match = map[input[0]];
        if (!match) {
          this.spinner.fail('项目不存在，请重新输入', true);
        }
        memberId = !this.options.test ? match.defaultId : match.testId;
      } else {
        match = map.default;
        memberId = input[0];
      }
    } else if (input.length === 2) {
      if (isNaN(Number(input[0])) && this.helper.isValidKey(input[0], map)) {
        match = map[input[0]];
        if (!match) {
          this.spinner.fail('项目不存在，请重新输入', true);
        }
        memberId = input[1];
      } else if (this.helper.isValidKey(input[1], map)) {
        match = map[input[1]];
        if (!match) {
          this.spinner.fail('项目不存在，请重新输入', true);
        }
        memberId = input[0];
      }
    }
    this.currentApp = match;
    this.memberId = memberId;
    this.service = axios.create({
      baseURL: `${
        this.options.test
          ? this.ls.get('oa.testPrefix')
          : this.ls.get('oa.apiPrefix')
      }${match.url.base}`,
      headers: {
        token: this.ls.get('oa.token')
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
    const shopName = (() => {
      if (match.name === 'ele') {
        return shop.shopName || shop.shopId;
      }
      return shop.memberName || shop.memberId;
    })();
    if (options.token === true) {
      this.spinner.text = `【${match.serviceName}】正在获取token:${shopName}`;
    } else if (!options.token) {
      this.spinner.text = `【${match.serviceName}】正在获取店铺信息:${shopName}`;
    }
    await this.helper.sleep(1500);
    const {
      data: { result }
    } = await this.service.post(match.url.login, match.loginKey(shop), {
      headers: {
        token: this.ls.get('oa.token')
      }
    });
    return {
      url: result,
      shop
    };
  }
  private async handleChainProject() {
    const match = this.currentApp;
    const { memberId } = this;
    this.logger.debug(`memberId:${memberId}`);
    const { options } = this;
    const searchParam = (() => {
      if (memberId) {
        return memberId;
      }
      if (!this.options.test) {
        return match.defaultId;
      }
      return match.testId;
    })();
    axios
      .post(
        `${this.ls.get('oa.oldApiPrefix')}/chain/occ/dkdAccount/oa/listAccount`,
        {
          searchParam,
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
    const { memberId } = this;
    this.logger.debug(`memberId:${memberId}`);
    const { options } = this;
    const token = this.ls.get('oa.token');
    const queryParam = (() => {
      if (memberId) {
        return memberId;
      }
      if (!this.options.test) {
        return match.defaultId;
      }
      return match.testId;
    })();
    const response = await axios.post(
      `${this.ls.get('oa.apiPrefix')}/retailManage/pageQueryOccOrder`,
      {
        queryParam,
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
      await login(this.options);
      return await this.handleChainProject();
    }
    const target = response.data.result.list[0];
    if (!target) {
      this.spinner.fail('店铺不存在', true);
    }
    const tokenResponse = await axios.post(
      `${this.ls.get('oa.apiPrefix')}/retailManage/getShopTokenToUse`,
      {
        memberId: target.memberId,
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
