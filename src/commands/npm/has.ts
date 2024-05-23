import npmInstall from "./install";
import BaseCommand from "@/util/BaseCommand";

interface Options {
  dev?: boolean;
  help?: boolean;
}
class Has extends BaseCommand {
  private args: string[];
  private options: Options;
  constructor(args: string[], options: Options) {
    super();
    this.args = args;
    this.options = options;
  }
  async run() {
    const { args, options, spinner } = this;
    if (options.help) {
      this.renderHelp();
      return;
    }
    const name = args[0];
    this.spinner.text = "正在查找";
    const listRet = await this.npm.getList(name);
    if (!listRet.list.length) {
      if (process.env.VITEST) {
        return false;
      }
      await this.handleNotFound(name, options.dev);
      return;
    }
    if (listRet.list.length === 1) {
      if (process.env.VITEST) {
        return true;
      }
      spinner.succeed(`${name}存在，版本号是${listRet.versionList[0]}`);
      return;
    }
    spinner.succeed("发现有多个符合条件的依赖:");
    listRet.versionList.forEach((text) => {
      console.log(`${text}`);
    });
  }
  private async handleNotFound(name: string, dev?: boolean) {
    const { action } = await this.helper.inquirer.prompt({
      type: "confirm",
      name: "action",
      message: `${name} 不存在，是否安装？`,
    });
    if (action) {
      await npmInstall([name], { dev });
    }
    this.spinner.stop();
  }
  private renderHelp() {
    // console.log(
    //   boxen(
    //     `
    //     判断本项目是否有某个模块，如果没有的话会确认是否安装，支持带scope的。
    //     ————————————————————————————————
    //     mycli npm has @scope/moduleName 这个是正常用法
    //     mycli npm has moduleName -d 如果没有安装，就添加到devDependencies中。
    // `,
    //     {
    //       borderColor: 'green',
    //       dimBorder: true,
    //       padding: 0,
    //       margin: 0
    //     }
    //   )
    // );
  }
}

export default (args: string[], options: Options) => {
  return new Has(args, options).run();
};
