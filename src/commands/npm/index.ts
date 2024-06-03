import { generateHelpDoc } from "@/util/helper";
import has from "./has";
import install from "./install";
import search from "./search";
import uninstall from "./uninstall";
import analyse from "./analyse";

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
  if (subCommand === "has") {
    has(data, options);
    return;
  }
  if (subCommand === "install") {
    install(data, options);
    return;
  }
  if (subCommand === "search") {
    search(data, options);
    return;
  }
  if (subCommand === "uninstall") {
    uninstall(data, options);
  }
  if (subCommand === "analyse") {
    analyse();
  }
}

function generateHelp() {
  generateHelpDoc({
    title: "npm",
    content: `npm命令支持下列子命令，请输入子命令 + "--help"选项查看：
- analyse:分析npm依赖
- has: 有安装某个依赖
- install：安装依赖，支持从本地通过"file:"的方式引入
- search: 查询单个/多个npm模块的信息
- uninstall: 卸载npm模块，支持全局卸载，还移除全局命令`,
  });
}
