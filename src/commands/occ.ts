import axios from 'axios';
import open from 'open';
import inquirer from 'inquirer';
import chalk from 'chalk';
import clipboard from 'clipboardy';
import BaseCommand from '../util/BaseCommand.js';
import fs from 'fs-extra';
import path from 'path';
import del from 'del';
interface Options {
  token: string | boolean;
  pc: boolean;
  copy: boolean;
}
interface MeituanLoginParams {
  appKey: string;
  memberId: string;
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
      login: ''
    },
    nameKey: '',
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.memberId,
      platform: item.platform,
      specificationId: 'v3'
    }),
    testId: ''
  },
  jysq: {
    appKey: '4',
    serviceName: '经营神器-美团',
    platform: 8,
    url: {
      base: '/occ',
      list: '/order/getOrderInfoList',
      login: '/order/replaceUserLogin'
    },
    nameKey: 'memberName',
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.memberId,
      platform: item.platform,
      specificationId: 'v3'
    }),
    testId: '15983528161'
  },
  zx: {
    appKey: '36',
    serviceName: '装修神器-美团',
    platform: 8,
    url: {
      base: '/occ',
      list: '/order/getOrderInfoList',
      login: '/order/replaceUserLogin'
    },
    nameKey: 'memberName',
    loginKey: (item: MeituanLoginParams) => ({
      appKey: item.appKey,
      memberId: item.memberId,
      platform: item.platform,
      specificationId: 'v3'
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
      login: '/auth/onelogin'
    },
    nameKey: 'shopName',
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
    const { input, options } = this;
    let match = {} as typeof map.jysq;
    let shopId = '';
    this.spinner.text = '正在搜索店铺';
    if (input.length === 0) {
      match = map.default;
      shopId = match.testId;
    } else if (input.length === 1) {
      if (isNaN(Number(input[0])) && this.helper.isValidKey(input[0], map)) {
        match = map[input[0]];
        if (!match) {
          this.spinner.fail('项目不存在，请重新输入');
          return;
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
          this.spinner.fail('项目不存在，请重新输入');
          return;
        }
        shopId = input[1];
      } else if (this.helper.isValidKey(input[1], map)) {
        match = map[input[1]];
        if (!match) {
          this.spinner.fail('项目不存在，请重新输入');
          return;
        }
        shopId = input[0];
      }
    }
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
        pageSize: 2,
        param: shopId,
        // startTime: parseDate(options.search),
        platform: match.platform,
        serviceName: match.serviceName
      });
      listData = res.data;
    } catch (error) {
      this.spinner.fail('服务器故障，请稍后再试');
      console.log(error);
      return;
    }
    if (listData.code === 401) {
      await this.login();
      await this.run();
      return;
    }
    if (!listData.result) {
      this.spinner.fail('服务器故障，请稍后再试');
      console.log(listData);
      return;
    }
    if (!listData.result.list.length) {
      this.spinner.fail('未找到店铺');
      return;
    }
    const shop = listData.result.list[0];
    if (this.helper.isValidKey(match.nameKey, shop)) {
      if (options.token === true) {
        this.spinner.text = `正在获取token:${shop[match.nameKey]}`;
      } else if (!options.token) {
        this.spinner.text = `正在打开店铺:${shop[match.nameKey]}`;
      }
      await this.helper.sleep(1500);
      const {
        data: { result }
      } = await service.post(match.url.login, match.loginKey(shop));
      if (options.token === true) {
        const { hash } = new URL(result);
        const token = hash.replace('#/login?code=', '');
        clipboard.writeSync(token);
        this.spinner.succeed(
          `已复制店铺 ${shop[match.nameKey]} 的token\n${token}`
        );
      } else if (options.token) {
        const { origin, pathname } = new URL(result);
        this.spinner.succeed('打开成功');
        open(`${origin}${pathname}#/login?code=${options.token}`);
      } else if (options.copy) {
        clipboard.writeSync(result);
        this.spinner.succeed(`已复制店铺 ${shop[match.nameKey]} 的地址`);
      } else {
        this.spinner.succeed('打开成功');
        if (options.pc && ['4', '36'].includes(match.appKey)) {
          // 只有美团经营神器和装修神器有PC端
          open(result.replace('app', ''));
        } else {
          open(result);
        }
      }
    }
  }
  private async login() {
    // 获取验证码
    const {
      data: { img, uuid }
    } = await axios.post('https://api.diankeduo.cn/zhili/captchaImage');
    const picBuffer = Buffer.from(img, 'base64');
    const target = path.resolve(this.helper.root, '.temp/vrCode.png');
    await fs.writeFile(target, picBuffer);
    this.spinner.text = `${chalk.yellow(
      '!'
    )} token失效，需重新登录，请先输入验证码`;
    await this.helper.openInEditor(target);
    const answer = await inquirer.prompt({
      type: 'input',
      message: '请输入验证码',
      name: 'vrCode'
    });
    const { username, password } = this.db.get('occ') as any;
    const {
      data: { token }
    } = await axios.post('https://api.diankeduo.cn/zhili/login', {
      username,
      password,
      uuid,
      code: answer.vrCode
    });
    this.db.set('occ.token', token);
    await del(target);
    this.spinner.text = '登录成功';
    this.helper.sleep(1500);
  }
}
