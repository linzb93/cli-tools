import BaseCommand from '../util/BaseCommand.js';
import publicIp from 'public-ip';
import internalIp from 'internal-ip';
import chalk from 'chalk';
class Ip extends BaseCommand {
  async run() {
    const [iIp, pIp] = await Promise.all([internalIp.v4(), publicIp.v4()]);
    this.logger.success(`内网IP: ${chalk.cyan(iIp)}
  公网IP: ${chalk.cyan(pIp)}`);
  }
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
