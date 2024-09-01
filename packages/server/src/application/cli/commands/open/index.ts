import Open, { Options } from "@/service/open";
import { generateHelpDoc } from "@/common/helper";

function generateHelp() {
  generateHelpDoc({
    title: "open",
    content: `打开指定的网页或项目
使用方法：
cli - 命令行项目
test - 本机的测试项目
source - 本机的开源项目代码，--name=<source> 打开具体的项目
cmd - 本机系统的命令行文件`,
  });
}

export default (name: string, options: Options) => {
  if (options.help) {
    generateHelp();
    return;
  }
  new Open().main(name, options);
};
