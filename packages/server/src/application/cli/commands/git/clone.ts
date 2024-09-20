import Clone, { Options } from "@/service/git/clone";
import { generateHelpDoc, subCommandCompiler } from "@/common/helper";
function generateHelp() {
  generateHelpDoc({
    title: "git clone",
    content: `支持从github、git地址或者npm网站clone项目。
使用方法：
git clone <url>
参数：
- <url>: git地址、github搜索关键词、npm网站搜索关键词
选项：
- dir: clone的地址
- from=github: 从github clone
- open: clone结束后使用vscode打开`,
  });
}

export default (source: string[], options: Options) => {
  if (options.help) {
    generateHelp();
    return;
  }
  subCommandCompiler(program => {
    program
      .command('clone')
      .option("--dir <dir>", "选择安装的目录")
      .option("--from <src>", "来源")
      .option("--open", "在VSCode中打开项目")
      .action(() => {
        new Clone().main(source, options)
      });
  })
  ;
};
