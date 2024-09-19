import { generateHelpDoc } from "@/common/helper";
import has from "./has";
import search from "./search";
import uninstall from "./uninstall";

interface IOption {
  help?: boolean;
  // 子模块的
  open?: boolean;
  full?: boolean;
  global?: boolean;
}

export default function (subCommand: string, data: string[], options: IOption) {
  if (options.help && !subCommand) {
    generateHelp();
    return;
  }
  const commandMap = {
    has: () => has(data, options),
    search: () => search(data, options),
    uninstall: () => uninstall(data, options),
  };
  if (commandMap[subCommand]) {
    commandMap[subCommand]();
  }
}

function generateHelp() {
  generateHelpDoc({
    title: "npm",
    content: `npm命令支持下列子命令，请输入子命令 + "--help"选项查看：
- has: 有安装某个依赖
- search: 查询单个/多个npm模块的信息
- uninstall: 卸载npm模块，支持全局卸载，还移除全局命令`,
  });
}
