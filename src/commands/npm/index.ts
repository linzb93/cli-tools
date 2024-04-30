import BaseCommand from '../../util/BaseCommand.js';
import boxen from 'boxen';
interface Options {
  help: boolean;
}
class Home extends BaseCommand {
  constructor(private options: Options) {
    super();
  }
  async run() {
    console.log(
      boxen(
        `
        npm相关的工具，具体可以进入各模块输入"--help"查看，
        例如"mycli npm install --help"。
        ————————————————————————————————
        install: 下载，可以从npm下载，也可以从本地复制；
        uninstall: 卸载，可以卸载全局的，还有移除相关的命令行；
        has: 判断本项目是否有某个模块，如果没有的话会确认是否安装；
        search: 获取某个模块的信息，包括描述、周下载量等。
    `,
        {
          borderColor: 'green',
          dimBorder: true,
          padding: 0,
          margin: 0
        }
      )
    );
  }
}

export default async (options: Options) => {
  new Home(options).run();
};
