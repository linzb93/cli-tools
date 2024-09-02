import Install, { Options } from "@/service/npm/install";
import { generateHelpDoc } from "@/common/helper";
function generateHelp() {
  generateHelpDoc({
    title: "npm install",
    content: `为本项目下载某个模块，可以从npm下载，也可以从本地复制。
使用方法：
npm install moduleName: 当参数不是地址格式的时候，判断为线上的npm模块
npm install /path/to/your_module 从本地复制过来
参数：
- -d: 添加到devDependencies中`,
  });
}
export default async (pkgs: string[], options: Options) => {
  if (options.help) {
    generateHelp();
  }
  new Install().main(pkgs, options);
};
