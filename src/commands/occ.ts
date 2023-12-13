import axios from 'axios';
import open from 'open';
import clipboard from 'clipboardy';
import BaseCommand from '../util/BaseCommand.js';
import fs from 'fs-extra';
import path from 'path';
import dayjs from 'dayjs';
import { SecretDB } from '../util/types';
import { stringify } from 'querystring';
import chalk from 'chalk';
interface Options {
  token: string | boolean;
  pc: boolean;
  copy: boolean;
  test: boolean;
  user: boolean;
  buyDate: string;
  endDate: string;
  version: '0' | '1';
}
interface MeituanLoginParams {
  appKey: string;
  shopId: string;
  platform: number;
}
interface EleLoginParams {
  shopId: string;
  userId: string;
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
interface HackCallback {
  (item: any): any;
}
const map = {
  default: {
    name: '',
    appKey: '',
    serviceName: '',
    platform: 0,
    appKeyName: 'appKey',
    url: {
      base: '',
      list: '',
      login: '',
      userApi: ''
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.shopId,
      platform: item.platform
    }),
    searchSupport: {
      buyDate: true,
      endDate: true,
      version: true
    },
    testId: ''
  },
  jysq: {
    name: 'jysq',
    appKey: '4',
    serviceName: '经营神器-美团',
    platform: 8,
    appKeyName: 'appKey',
    url: {
      base: '/',
      list: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '/api'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.shopId,
      platform: item.platform
    }),
    searchSupport: {
      buyDate: true,
      endDate: true,
      version: true
    },
    testId: '15983528161'
  },
  pj: {
    name: 'pj',
    appKey: '73',
    serviceName: '评价神器-美团',
    platform: 8,
    appKeyName: 'appKey',
    url: {
      base: '/',
      list: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '/api'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.shopId,
      platform: item.platform
    }),
    searchSupport: {
      buyDate: true,
      endDate: true,
      version: true
    },
    testId: '16499283381'
  },
  im: {
    name: 'im',
    appKey: '75',
    serviceName: 'IM神器-美团',
    platform: 8,
    appKeyName: 'appKey',
    url: {
      base: '/',
      list: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '/api'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.shopId,
      platform: item.platform
    }),
    searchSupport: {
      buyDate: true,
      endDate: true,
      version: true
    },
    testId: '16505256214'
  },
  yx: {
    name: 'yx',
    appKey: '76',
    serviceName: '营销神器-美团',
    platform: 8,
    appKeyName: 'appKey',
    url: {
      base: '/',
      list: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '/api'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.shopId,
      platform: item.platform
    }),
    searchSupport: {
      buyDate: true,
      endDate: true,
      version: true
    },
    testId: '16505284824'
  },
  dj: {
    name: 'dj',
    appKey: '85',
    serviceName: '点金大师-美团',
    platform: 8,
    appKeyName: 'appKey',
    url: {
      base: '/',
      list: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '/api'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.shopId,
      platform: item.platform
    }),
    searchSupport: {
      buyDate: true,
      endDate: true,
      version: true
    },
    testId: '16668523733'
  },
  sp: {
    name: 'sp',
    appKey: '106',
    serviceName: '商品大师-美团',
    platform: 8,
    appKeyName: 'appKey',
    url: {
      base: '/',
      list: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '/api'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.shopId,
      platform: item.platform
    }),
    searchSupport: {
      buyDate: true,
      endDate: true,
      version: true
    },
    testId: '16928614773'
  },
  sg: {
    name: 'sg',
    testId: 't_OtWpj5Vx31',
    appKey: 122726,
    url: 'https://sg.diankeduo.net/pages/shangou/#/'
  },
  zx: {
    name: 'zx',
    appKey: '36',
    serviceName: '装修神器-美团',
    platform: 8,
    appKeyName: 'appKey',
    url: {
      base: '/',
      list: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '/api'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.shopId,
      platform: item.platform
    }),
    searchSupport: {
      buyDate: true,
      endDate: true,
      version: true
    },
    testId: '16159400501'
  },
  chain: {
    name: 'chain',
    testId: '15859095882'
  },
  ele: {
    name: 'ele',
    appId: '29665924',
    serviceName: '店客多-饿了么经营神器',
    baseURL: '/eleocc',
    listUrl: '/manage/getOrderList',
    platform: 11,
    appKeyName: 'appId',
    url: {
      base: '/eleocc',
      list: '/manage/getOrderList',
      login: '/auth/onelogin',
      userApi: '//api'
    },
    loginKey: (item: EleLoginParams) => ({
      appId: '29665924',
      shopId: item.shopId,
      userId: item.userId
    }),
    searchSupport: {
      buyDate: true,
      endDate: false,
      version: (item: ShopItem) => (item.price === '0.0' ? 0 : 1)
    },
    testId: '160276429'
  }
};
map.default = map.jysq;
class OCC extends BaseCommand {
  private input: string[];
  private options: Options;
  constructor(input: string[], options: Options) {
    super();
    this.input = input;
    this.options = options;
  }
  async run() {
    const { options } = this;
    const { match, shopId } = this.getMatchProj();
    if (match.name === 'chain') {
      this.handleChainProject(match, shopId);
      return;
    }
    if (match.name === 'sg') {
      this.handleSgProject(match, shopId);
      return;
    }
    const { shop, url } = await this.getShop(match, shopId);
    if (options.token === true) {
      // token无值，就只是复制token
      const { hash } = new URL(url);
      const fullToken = hash.replace('#/login?code=', '');
      const token = fullToken.replace(/occ_(senior_)?/, '').replace(/&.+/, '');
      clipboard.writeSync(token);
      this.spinner.succeed(
        `【${match.serviceName}】已复制店铺 ${
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
        `【${match.serviceName}】已复制店铺 ${
          shop.shopName || shop.shopId
        } 的地址`
      );
    } else if (options.user) {
      const { hash } = new URL(url);
      const token = hash.replace('#/login?code=', '');
      const { data } = await axios.post(
        match.url.userApi,
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
      if (options.pc && ['4', '36', '75'].includes(match.appKey)) {
        // 只有美团经营神器和装修神器有PC端
        open(url.replace('app', ''));
      } else {
        open(url);
      }
      this.spinner.succeed(
        `【${match.serviceName}】店铺 ${shop.shopName || shop.shopId} 打开成功`
      );
    }
  }
  private getMatchProj(): { match: typeof map.default; shopId: string } {
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
    if (options.buyDate || options.endDate || options.version) {
      return {
        match,
        shopId: ''
      };
    }
    return {
      match,
      shopId
    };
  }
  private async getShop(
    match: typeof map.default,
    shopId: string
  ): Promise<{
    shop: ShopItem;
    url: string;
  }> {
    const { options } = this;
    if (!this.ls.get('oa.token')) {
      await this.login();
      return await this.getShop(match, shopId);
    }
    const service = axios.create({
      baseURL: `${
        options.test
          ? this.ls.get('oa.testPrefix')
          : this.ls.get('oa.apiPrefix')
      }${match.url.base}`,
      headers: {
        token: this.ls.get('oa.token')
      }
    });
    this.logger.debug(`token:${this.ls.get('oa.token')}`);
    let listData: ShopListResponse;
    this.logger.debug(
      `高级搜索参数：${JSON.stringify(this.getSearchDate(match))}`
    );
    const listSearchParams = {
      // @ts-ignore
      [match.appKeyName]: match[match.appKeyName],
      pageIndex: 1,
      pageSize: 1,
      param: shopId,
      platform: match.platform,
      version: options.version ? Number(options.version) : null,
      serviceName: match.serviceName,
      ...this.getSearchDate(match)
    };
    // 针对项目不满足搜索条件而采取的hacker
    if (
      Object.keys(match.searchSupport).some((item) => {
        if (this.helper.isValidKey(item, match.searchSupport)) {
          return typeof match.searchSupport[item] === 'function';
        }
        return false;
      })
    ) {
      listSearchParams.pageSize = 30;
    }
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
      await this.login();
      return await this.getShop(match, shopId);
    } else if (!listData.result) {
      this.logger.debug(listData);
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
    let shop = {} as ShopItem;
    if (
      Object.keys(match.searchSupport).some((item) => {
        if (this.helper.isValidKey(item, match.searchSupport)) {
          return typeof match.searchSupport[item] === 'function';
        }
        return false;
      })
    ) {
      const callbackStr = Object.keys(match.searchSupport).find((item) => {
        if (this.helper.isValidKey(item, match.searchSupport)) {
          return typeof match.searchSupport[item] === 'function';
        }
        return false;
      }) as string;
      let callback: HackCallback;
      if (this.helper.isValidKey(callbackStr, match.searchSupport)) {
        callback = match.searchSupport[callbackStr];
      }
      if (this.helper.isValidKey(callbackStr, options)) {
        shop = listData.result.list.find((item) => {
          return (
            callback(item) === options[callbackStr] ||
            callback(item) === Number(options[callbackStr])
          );
        }) as ShopItem;
      }
    } else {
      shop = listData.result.list[0];
    }
    shop = listData.result.list[0];
    if (options.token === true) {
      this.spinner.text = `【${match.serviceName}】正在获取token:${
        shop.shopName || shop.shopId
      }`;
    } else if (!options.token) {
      this.spinner.text = `【${match.serviceName}】正在打开店铺:${
        shop.shopName || shop.shopId
      }`;
    }
    await this.helper.sleep(1500);
    const {
      data: { result }
    } = await service.post(match.url.login, match.loginKey(shop), {
      headers: {
        token: this.ls.get('oa.token')
      }
    });
    return {
      url: result,
      shop
    };
  }
  // 通过用户输入的验证码登录，将token存入本地之后再次调用获取店铺信息的接口。
  private async login() {
    this.spinner.warning('登录过期，需重新登录，请输入验证码。');
    await this.helper.sleep(1000);
    const {
      data: { img, uuid }
    } = await axios.get(this.ls.get('oa.apiPrefix') + '/captchaImage');
    const picBuffer = Buffer.from(img, 'base64');
    const target = path.resolve(this.helper.root, '.temp/vrCode.png');
    await fs.writeFile(target, picBuffer);
    await this.helper.sleep(500);
    await this.helper.openInEditor(target);
    const answer = await this.helper.inquirer.prompt({
      type: 'input',
      message: '请输入验证码',
      name: 'vrCode'
    });
    this.spinner.text = '正在登录';
    const { username, password } = this.ls.get('oa') as SecretDB['oa'];
    const {
      data: { token }
    } = await axios.post(this.ls.get('oa.apiPrefix') + '/login', {
      username,
      password,
      uuid,
      code: answer.vrCode
    });
    this.ls.set('oa.token', token);
    await fs.remove(target);
    this.spinner.succeed('登录成功', true);
    await this.helper.sleep(1500);
  }
  private async handleChainProject(match: any, shopId: string) {
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
            `【${match.serviceName}】已复制账号${chalk.yellow(
              `【${brandName}】`
            )}token：\n${token}`
          );
          clipboard.writeSync(token);
        } else {
          this.spinner.succeed(
            `正在打开${chalk.yellow(`【${brandName}】`)}的管理后台`
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
  private async handleSgProject(match: any, shopId: string) {
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
      await this.login();
      return await this.handleChainProject(match, shopId);
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
        `正在打开${chalk.yellow(`【${target.shopName}】`)}的店铺`
      );
      open(`${match.url}login?code=${occToken}`);
    }
  }
  private getSearchDate(match: typeof map.default) {
    if (this.options.buyDate && match.searchSupport.buyDate === true) {
      return {
        timeType: 1,
        ...this.getParsedDate('buyDate')
      };
    }
    if (this.options.endDate && match.searchSupport.endDate === true) {
      return {
        timeType: 2,
        ...this.getParsedDate('endDate')
      };
    }
    return {};
  }
  private getParsedDate(type: 'buyDate' | 'endDate'): {
    startTime: string;
    endTime: string;
  } {
    let datas = [0, 0];
    if (type === 'buyDate') {
      datas = this.parseOpr(this.options.buyDate, true);
    } else if (type === 'endDate') {
      datas = this.parseOpr(this.options.endDate);
    }
    return {
      startTime: dayjs().add(datas[0], 'd').format('YYYY-MM-DD 00:00:00'),
      endTime: dayjs().add(datas[1], 'd').format('YYYY-MM-DD 23:59:59')
    };
  }
  private parseOpr(dateStr: string, isNegative?: boolean): number[] {
    const output = {
      lt: false,
      gt: false,
      eq: false,
      datas: [] as number[],
      isRange: false
    };
    const sign = isNegative ? -1 : 1;
    if (dateStr.startsWith('<=')) {
      output.lt = true;
      output.eq = true;
    } else if (dateStr.startsWith('>=')) {
      output.gt = true;
      output.eq = true;
    } else if (dateStr.startsWith('<')) {
      output.lt = true;
    } else if (dateStr.startsWith('>')) {
      output.gt = true;
    } else if (dateStr.includes('~')) {
      output.isRange = true;
    } else {
      output.eq = true;
    }
    const match = dateStr.match(/<=|>=|<|>/);
    if (match) {
      const data = Number(dateStr.replace(match[0], ''));
      if (output.lt) {
        output.datas = [0, (output.eq ? data : data - 1) * sign];
      }
      if (output.gt) {
        output.datas = [
          (output.eq ? data : data + 1) * sign,
          (data + 1) * sign
        ];
      }
      if (output.eq && !output.lt && !output.gt) {
        output.datas = [data * sign, data * sign];
      }
    } else {
      if (output.isRange) {
        const seg = dateStr.split('~');
        output.datas = [Number(seg[0]) * sign, Number(seg[1]) * sign];
      } else {
        output.datas = [Number(dateStr) * sign, Number(dateStr) * sign];
      }
    }
    if (output.datas[0] > output.datas[1]) {
      const temp = output.datas[0];
      output.datas[0] = output.datas[1];
      output.datas[1] = temp;
    }
    return output.datas;
  }
}

export default (input: string[], options: Options) => {
  new OCC(input, options).run();
};
