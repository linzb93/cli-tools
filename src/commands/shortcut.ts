import BaseCommand from '../util/BaseCommand.js';
import chalk from 'chalk';
class Shortcut extends BaseCommand {
  private name: string;
  constructor(name: string) {
    super();
    this.name = name;
  }
  run() {
    const map = [
      {
        title: '聚焦文件资源管理器（自定义）',
        windows: 'alt + `',
        mac: ''
      },
      {
        title: '切换至下一个文件',
        windows: 'ctrl + page down',
        mac: ''
      },
      {
        title: '切换至上一个文件',
        windows: 'ctrl + page up',
        mac: ''
      },
      {
        title: '新建文件',
        windows: 'ctrl + alt + n',
        mac: ''
      },
      {
        title: '新建文件夹',
        windows: 'ctrl + shift + alt + n',
        mac: ''
      },
      {
        title: '聚焦终端',
        windows: 'ctrl + j',
        mac: ''
      },
      {
        title: '新建终端',
        windows: 'ctrl + shift + `',
        mac: ''
      },
      {
        title: '聚焦上一个终端',
        windows: 'ctrl + page up',
        mac: ''
      },
      {
        title: '聚焦下一个终端',
        windows: 'ctrl + page down',
        mac: ''
      },
      {
        title: '清除终端内容',
        windows: 'ctrl + k',
        mac: ''
      }
    ];
    const list = this.name
      ? map.filter((item) => item.title.includes(this.name))
      : map;
    if (!list.length) {
      this.logger.error('没有找到对应的命令');
    } else {
      console.log(
        list
          .map(
            (item) =>
              `${chalk.cyan(item.title)} ${
                this.helper.isWin ? item.windows : item.mac
              }`
          )
          .join('\n')
      );
    }
  }
}

export default (name: string) => {
  new Shortcut(name).run();
};
