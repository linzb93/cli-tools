import BaseCommand from '../../util/BaseCommand.js';
import fs from 'fs-extra';
import path from 'path';
import { SecretDB } from '../../util/types';
import axios from 'axios';
class Login extends BaseCommand {
  async run() {
    this.spinner.warning('登录过期，需重新登录，请输入验证码。');
    await this.helper.sleep(1000);
    const {
      data: { img, uuid }
    } = await axios.get(this.ls.get('oa.apiPrefix') + '/captchaImage');
    const picture = path.resolve(this.helper.root, '.temp/vrCode.png');
    await fs.writeFile(picture, Buffer.from(img, 'base64'));
    await this.helper.openInEditor(picture);
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
    await fs.remove(picture);
    this.spinner.succeed('登录成功', true);
    await this.helper.sleep(1500);
  }
}
// 通过用户输入的验证码登录，将token存入本地之后再次调用获取店铺信息的接口。
export default async () => {
  await new Login().run();
};
