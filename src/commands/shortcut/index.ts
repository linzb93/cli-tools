import BaseCommand from '../../util/BaseCommand.js';
import chalk from 'chalk';
import open from 'open';
class Shortcut extends BaseCommand {
  constructor(private name: string) {
    super();
  }
  // 查询 Windows / macOS 系统下，VSCode和Chrome的快捷键。
  run() {
    const all = [
      {
        title: 'VSCode',
        children: [
          {
            title: '聚焦文件资源管理器（自定义）',
            windows: 'alt + `',
            mac: ''
          },
          {
            title: '切换至下一个文件',
            windows: 'ctrl + page down',
            mac: 'shift + cmd + ]'
          },
          {
            title: '切换至上一个文件',
            windows: 'ctrl + page up',
            mac: 'shift + cmd + ['
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
        ]
      },
      {
        title: 'Chrome',
        children: [
          {
            title: '切换到下一个标签',
            windows: 'ctrl + page up',
            mac: 'command + option + ->'
          }
        ]
      }
    ];
    const isMac = process.platform === 'darwin';
    const subRender = (item: { title: string; mac: string; windows: string }) =>
      `${chalk.cyan(item.title)} - ${isMac ? item.mac : item.windows}`;
    if (!this.name) {
      // 输出全部
      console.log(
        all
          .map((panel) => {
            return `${chalk.bold.red(panel.title)}
  ${panel.children.map(subRender).join('\n  ')}`;
          })
          .join('\n')
      );
    } else if (this.name === 'cmd') {
      open(
        `https://www.yuque.com/linzb93/fedocs/${isMac ? 'tu3wft' : 'rrfmzp'}`
      );
    } else {
      const list = all
        .map((panel) => panel.children)
        .flat()
        .filter((item) => item.title.includes(this.name));
      console.log(list.map((item) => subRender(item)).join('\n'));
    }
  }
}

export default (name: string) => {
  new Shortcut(name).run();
};
