import inquirer from 'inquirer';
import ora, { Ora } from 'ora';
import getNpmList from './util/getList.js';
import NpmInstall from './install.js';
import BaseCommand from '../../util/BaseCommand.js';

interface Flag {
  dev?: boolean;
}
export default class extends BaseCommand {
  private args: string[];
  private flag: Flag;
  private spinner: Ora;
  constructor(args: string[], flag: Flag) {
    super();
    this.args = args;
    this.flag = flag;
    this.spinner = ora('正在查找');
  }
  async run() {
    const { args, flag, spinner } = this;
    const name = args[0];
    spinner.start();
    const listRet = await getNpmList(name);
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
    const { spinner } = this;
    spinner.stop();
    const { action } = await inquirer.prompt({
      type: 'confirm',
      name: 'action',
      message: `${name} 不存在，是否安装？`
    });
    if (action) {
      await new NpmInstall([name], { dev }).run();
    }
  }
}
