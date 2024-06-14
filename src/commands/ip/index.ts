import BaseCommand from "@/util/BaseCommand";
import publicIp from "public-ip";
import internalIp from "internal-ip";
import chalk from "chalk";
class Ip extends BaseCommand {
  async run() {
    this.spinner.text = '正在获取IP';
    const [iIp, pIp] = await Promise.all([internalIp.v4(), publicIp.v4()]);
    this.spinner.succeed(`内网IP: ${chalk.cyan(iIp)}
  公网IP: ${chalk.cyan(pIp)}`);
  // ipv6就不要了，时间很久，不知道能不能获取。
  }
  /**
   * 获取内网IP。
   * @returns {Promise<string>} 内网IP地址
   */
  async get() {
    const iIp = await internalIp.v4();
    return iIp;
  }
}

export default () => {
  new Ip().run();
};

export function get() {
  return new Ip().get();
}
