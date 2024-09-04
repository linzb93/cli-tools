import BaseCommand from "@/common/BaseCommand";
import chalk from "chalk";
import { isWin } from "@/common/constant";

class Shortcut extends BaseCommand {
  constructor(private name: string) {
    super();
  }
  main() {
    const map = [
      {
        type: "common",
        children: [
          {
            title: "切换至下一个页面",
            windows: "ctrl + page down",
            mac: "shift + cmd + ]",
          },
          {
            title: "切换至上一个页面",
            windows: "ctrl + page up",
            mac: "shift + cmd + [",
          },
          {
            title: "截图",
            windows: "ctrl + a",
            mac: "shift + command + 2",
          },
        ],
      },
      {
        type: "vscode",
        children: [
          {
            title: "聚焦文件资源管理器（自定义）",
            windows: "alt + `",
            mac: "option + `",
          },
          {
            title: "新建文件",
            windows: "ctrl + alt + n",
            mac: "",
          },
          {
            title: "新建文件夹",
            windows: "ctrl + shift + alt + n",
            mac: "",
          },
          {
            title: "聚焦终端",
            windows: "ctrl + j",
            mac: "command + j",
          },
          {
            title: "新建终端",
            windows: "ctrl + shift + `",
            mac: "shift + option + `",
          },
          {
            title: "清除终端内容",
            windows: "ctrl + k",
            mac: "ctrl + k",
          },
          {
            title: "拆分编辑器",
            windows: "ctrl + \\",
            mac: "",
          },
        ],
      },
      {
        type: "chrome",
        children: [
          {
            title: "切换到下一个标签",
            windows: "",
            mac: "command + option + ->",
          },
        ],
      },
    ];
    if (!this.name) {
      console.log(
        map
          .map((panel) => {
            return `${chalk.bold.red(panel.type)}
  ${panel.children
    .map(
      (item) =>
        `${chalk.blue(item.title)} ${isWin ? item.windows : item.mac}`
    )
    .join("\n  ")}`;
          })
          .join("\n")
      );
    } else {
      if (!["chrome", "vscode"].includes(this.name)) {
        this.logger.error("不存在的平台，只支持vscode和chrome");
      } else {
        const list = [map[0], map.find((panel) => panel.type === this.name)];
        const flatList = list.reduce(
          (acc, panel) => acc.concat(panel.children),
          []
        );
        console.log(
          flatList
            .map(
              (item) =>
                `${chalk.blue(item.title)} ${
                  isWin ? item.windows : item.mac
                }`
            )
            .join("\n")
        );
      }
    }
  }
}

export default (name: string) => {
  new Shortcut(name).main();
};
