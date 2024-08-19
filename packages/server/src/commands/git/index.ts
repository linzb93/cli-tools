import clone from "./clone";
import deploy from "./deploy";
import pull from "./pull";
import push from "./push";
import rename from "./rename";
import branch from "./branch";
import scan from "./scan";
import tag from "./tag";
import * as helper from "@/util/helper";

export default function (subCommand: string, data: string[], options: any) {
  if (options.help && !subCommand) {
    generateHelp();
    return;
  }
  const commandMap = {
    clone: () => clone(data, options),
    deploy: () => deploy(data, options),
    pull: () => pull(),
    push: () => push(),
    scan: () => scan(),
    branch: () => branch(),
    rename: () => rename(),
    tag: () => tag(data, options),
  };
  if (commandMap[subCommand]) {
    commandMap[subCommand]();
  }
}

function generateHelp() {
  helper.generateHelpDoc({
    title: "git",
    content: `git命令支持下列子命令，请输入子命令 + "--help"选项查看：
- clone: 将远程仓库复制到本地，支持选择文件夹。
- pull/push: 同 git pull/push，有失败重试功能。
- rename: 批量重命名git项目的文件名。
- scan: 扫描指定文件夹寻找是否有项目未提交/未推送。
- deploy: 一键部署代码，包括git提交、同步、打tag。
- tag: 获取最新的tag，或者打tag。`,
  });
}
