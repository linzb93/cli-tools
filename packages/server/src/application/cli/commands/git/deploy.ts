import chalk from "chalk";
import Deploy, { Options } from "@/service/git/deploy";
import { generateHelpDoc } from "@/common/helper";
function generateHelp() {
  generateHelpDoc({
    title: "git deploy",
    content: `一键部署git项目(包括push和tag)，支持以下部署方式：
- 从开发分支合并到测试分支并部署
- 从开发分支合并到主分支并部署
- 从主分支部署
- 部署至Github
使用方法：
${chalk.cyan("git deploy prod")}
参数：
- prod: 合并到主分支并部署
选项：
- -c/--current: 只push，没有tag
- --commit=: 输入commit内容
- --tag=: 输入tag标签`,
  });
}

export default (data: string[], options: Options) => {
  if (options.help) {
    generateHelp();
    return;
  }
  new Deploy().main(data, options);
};
