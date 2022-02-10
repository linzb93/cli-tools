import NpmInstall from './install.js';
import BaseCommand from '../../util/BaseCommand.js';

interface Flag {
  dev?: boolean;
}
export default class extends BaseCommand {
  private args: string[];
  private flag: Flag;
  constructor(args: string[], flag: Flag) {
    super();
    this.args = args;
    this.flag = flag;
  }
  async run() {
    const { args, flag, spinner } = this;
    const name = args[0];
    this.spinner.text = '正在查找';
    const listRet = await this.npm.getList(name);
    if (!listRet.list.length) {
      this.handleNotFound(name, flag.dev);
      return;
    }
    if (listRet.list.length === 1) {
      spinner.succeed(`${name}存在，版本号是${listRet.versionList[0]}`);
      return;
    }
    spinner.succeed('发现有多个符合条件的依赖:');
    listRet.versionList.forEach((text) => {
      console.log(`${text}`);
    });
  }
  private async handleNotFound(name: string, dev?: boolean) {
    const { action } = await this.helper.inquirer.prompt({
      type: 'confirm',
      name: 'action',
      message: `${name} 不存在，是否安装？`
    });
    if (action) {
      await new NpmInstall([name], { dev }).run();
    }
  }
}
