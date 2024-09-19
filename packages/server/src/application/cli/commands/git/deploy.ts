import chalk from "chalk";
import Deploy, { Options } from "@/service/git/deploy";
import { generateHelpDoc, generateProcessArgv } from "@/common/helper";
import { Command } from "commander";

const program = new Command();

function generateHelp() {
  generateHelpDoc({
    title: "git deploy",
    content: `一键部署git项目(包括push和tag)，支持以下部署方式：
- 从开发分支合并到测试分支并部署
- 从开发分支合并到主分支并部署
- 从主分支部署
- 部署至Github
使用方法：
${chalk.cyan("git deploy")}
选项：
- prod: 合并到主分支并部署
- -c/--current: 只推送到当前分支，没有打tag
- --commit=: 输入commit内容
- --tag=: 输入tag标签
- --only-push: 只推送不拉取，适用于Github等网络缓慢的项目`,
  });
}

export default (data: string[], options: Options) => {
  if (options.help) {
    generateHelp();
    return;
  }
  program
  .command('deploy')
  .option("--commit <msg>", "提交信息")
  .option("--tag <name>", "tag名称")
  .option("-c, --current", "当前的")
  .option("--help", "显示帮助文档")
  .option("--prod", "生产分支")
  .option("--only-push", "只推送")
  .action(() => {
    new Deploy().main(data, options);
  });
  program.parse(generateProcessArgv(options));
};
