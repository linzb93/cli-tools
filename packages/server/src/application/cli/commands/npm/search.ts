import Search, { Options } from "@/service/npm/search";
import { generateHelpDoc } from "@/common/helper";

function generateHelp() {
  generateHelpDoc({
    title: "npm search",
    content: `查询单个/多个npm模块的信息
使用方法：
- npm search moduleName --open 查询单个模块，返回信息后，打开模块对应的主页
- npm search module1 module2 查询多个npm模块，以table的方式输出`,
  });
}
export default async (args: string[], options: Options) => {
  if (options.help) {
    generateHelp();
  }
  return new Search().main(args, options);
};
