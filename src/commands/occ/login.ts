import BaseCommand from '../../util/BaseCommand.js';
import fs from 'fs-extra';
import path from 'path';
import { SecretDB } from '../../util/types';
import axios from 'axios';
class Login extends BaseCommand {
  private isTest: boolean;
  constructor(isTest: boolean) {
    super();
    this.isTest = isTest;
  }
  async run() {
    const { isTest } = this;
    this.spinner.warning('登录过期，需重新登录，请输入验证码。');
    await this.helper.sleep(1000);
    const {
      data: { img, uuid }
    } = await axios.get(
      this.ls.get(isTest ? 'oa.testPrefix' : 'oa.apiPrefix') + '/captchaImage'
    );
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
    } = await axios.post(
      this.ls.get(isTest ? 'oa.testPrefix' : 'oa.apiPrefix') + '/login',
      {
        username,
        password,
        uuid,
        code: answer.vrCode
      }
    );
    if (isTest) {
      this.ls.set('oa.testToken', token);
    } else {
      this.ls.set('oa.token', token);
    }
    await fs.remove(target);
    this.spinner.succeed('登录成功', true);
    await this.helper.sleep(1500);
  }
}
// 通过用户输入的验证码登录，将token存入本地之后再次调用获取店铺信息的接口。
export default async (isTest: boolean) => {
  new Login(isTest).run();
};
