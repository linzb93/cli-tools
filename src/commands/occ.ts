import axios from 'axios';
import open from 'open';
import clipboard from 'clipboardy';
import BaseCommand from '../util/BaseCommand.js';
import fs from 'fs-extra';
import path from 'path';
import del from 'del';
import { SecretDB } from '../util/types';

interface Options {
  token: string | boolean;
  pc: boolean;
  copy: boolean;
  user:boolean;
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
}
interface ShopListResponse {
  result: {
    list: ShopItem[];
  };
  code: number;
}
const map = {
  default: {
    appKey: '',
    serviceName: '',
    platform: 0,
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
    testId: ''
  },
  jysq: {
    appKey: '4',
    serviceName: '经营神器-美团',
    platform: 8,
    url: {
      base: '/',
      list: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '//api'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.shopId,
      platform: item.platform
    }),
    testId: '15983528161'
  },
  zx: {
    appKey: '36',
    serviceName: '装修神器-美团',
    platform: 8,
    url: {
      base: '/',
      list: '/query/businessInfoList',
      login: '/occ/order/replaceUserLogin',
      userApi: '//api'
    },
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.shopId,
      platform: item.platform
    }),
    testId: '16159400501'
  },
  ele: {
    appId: '29665924',
    serviceName: '店客多-裂变神器',
    baseURL: '/eleocc',
    listUrl: '/manage/getOrderList',
    platform: 11,
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
    testId: '160276429'
  }
};
map.default = map.jysq;
export default class extends BaseCommand {
  private input: string[];
  private options: Options;
  constructor(input: string[], options: Options) {
    super();
    this.input = input;
    this.options = options;
  }
  async run() {
    const {options} = this;
    const {match, shopId} = this.getMatch();
    const {shop, url} = await this.getShop(match, shopId);
    if (options.token === true) {
      // token无值，就只是复制token
      const { hash } = new URL(url);
      const token = hash.replace('#/login?code=', '');
      clipboard.writeSync(token);
      this.spinner.succeed(`已复制店铺 ${shop.shopName} 的token\n${token}`);
    } else if (options.token) {
      // token有值，就是根据token登录
      const { origin, pathname } = new URL(url);
      this.spinner.succeed('打开成功');
      open(`${origin}${pathname}#/login?code=${options.token}`);
    } else if (options.copy) {
      clipboard.writeSync(url);
      this.spinner.succeed(`已复制店铺 ${shop.shopName} 的地址`);
    } else if (options.user) {
        const { hash } = new URL(url);
        const token = hash.replace('#/login?code=', '');
        const {data} = await axios.post(match.url.userApi, {}, {
            headers: {
                token
            }
        });
        this.spinner.succeed(`获取店铺 ${shop.shopName} 信息成功`);
        console.log(data.result);
    } else {
      if (options.pc && ['4', '36'].includes(match.appKey)) {
        // 只有美团经营神器和装修神器有PC端
        open(url.replace('app', ''));
      } else {
        open(url);
      }
      this.spinner.succeed(`店铺 ${shop.shopName} 打开成功`);
    }
  }
  private getMatch():{match: typeof map.default, shopId: string} {
    const { input } = this;
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
    return {
        match,
        shopId
    }
  }
  private async getShop(match: typeof map.default, shopId: string):Promise<{
    shop:ShopItem;
    url: string
}> {
    const {options} = this;
    const service = axios.create({
        baseURL: `https://api.diankeduo.cn/zhili${match.url.base}`,
        headers: {
          token: this.db.get('occ.token')
        }
      });
      let listData: ShopListResponse;
      try {
        const res = await service.post(match.url.list, {
          appKey: match.appKey,
          pageIndex: 1,
          pageSize: 1,
          param: shopId,
          platform: match.platform,
          serviceName: match.serviceName
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
        await this.login();
        await this.run();
      } else if (!listData.result) {
        this.spinner.fail(
          this.helper.showWeakenTips(
            '服务器故障，请稍后再试。',
            JSON.stringify(listData)
          )
        );
      } else if (!listData.result.list.length) {
        this.spinner.fail('未找到店铺');
      }
      const shop = listData.result.list[0];
      if (options.token === true) {
        this.spinner.text = `正在获取token:${shop.shopName}`;
      } else if (!options.token) {
        this.spinner.text = `正在打开店铺:${shop.shopName}`;
      }
      await this.helper.sleep(1500);
      const {
        data: { result }
      } = await service.post(match.url.login, match.loginKey(shop), {
        headers: {
          token: this.db.get('occ.token')
        }
      });
      return {
          url: result,
          shop
      }
  }
  private async login() {
    // 获取验证码
    this.spinner.warning('token失效，需重新登录，请先输入验证码');
    await this.helper.sleep(1000);
    const {
      data: { img, uuid }
    } = await axios.get('https://api.diankeduo.cn/zhili/captchaImage');
    const picBuffer = Buffer.from(img, 'base64');
    const target = path.resolve(this.helper.root, '.temp/vrCode.png');
    await fs.writeFile(target, picBuffer);
    await this.helper.openInEditor(target);
    const answer = await this.helper.inquirer.prompt({
      type: 'input',
      message: '请输入验证码',
      name: 'vrCode'
    });
    this.spinner.text = '正在登录';
    const { username, password } = this.db.get('occ') as SecretDB['occ'];
    const {
      data: { token }
    } = await axios.post('https://api.diankeduo.cn/zhili/login', {
      username,
      password,
      uuid,
      code: answer.vrCode
    });
    this.db.set('occ.token', token);
    // TODO: 在VSCode中打开后无法删除
    del.sync(target);
    this.spinner.succeed('登录成功', true);
    await this.helper.sleep(1500);
  }
}
