import Clone, { Options } from "@/service/git/clone";
import { generateHelpDoc } from "@/common/helper";
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
- open: clone结束后使用vscode打开
- install: 安装npm依赖`,
  });
}

export default (source: string[], options: Options) => {
  if (options.help) {
    generateHelp();
    return;
  }
  new Clone().main(source, options);
};
