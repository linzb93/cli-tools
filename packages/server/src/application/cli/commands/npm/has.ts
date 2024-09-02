import Has, { Options } from "@/service/npm/has";
import { generateHelpDoc } from "@/common/helper";

function generateHelp() {
  generateHelpDoc({
    title: "npm has",
    content: `判断本项目是否有某个模块，如果没有的话会确认是否安装，支持带scope的。
  使用方法：
  npm has @scope/moduleName
  参数：
  - -d: 如果没有安装，就添加到devDependencies中。`,
  });
}

export default (args: string[], options: Options) => {
  if (options.help) {
    generateHelp();
  }
  return new Has().main(args, options);
};
