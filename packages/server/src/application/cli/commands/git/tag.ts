import Tag, { Options } from "@/service/git/tag";
import { generateHelpDoc, subCommandCompiler } from "@/common/helper";
function generateHelp() {
  generateHelpDoc({
    title: "git tag",
    content: `git项目获取、添加、删除tag。建议tag的格式是"v" + 版本号
使用方法：
打tag：git tag v2.1.1.2
获取最近10个tag: git tag --last=10。没有这个选项的话就是获取所有的tag。
选项：
- delete: 删除tag，包括本地和远端的
参数：
- last=: 获取最近几个tag
- head=: 删除最前面的几个tag
- get: 获取并复制最近的一次tag`,
  });
}

export default function (datas: string[], options: Options) {
  if (options.help) {
    generateHelp();
    return;
  }
  subCommandCompiler(program => {
    program
      .command('tag')
      .option("--last <len>", "最近几次")
      .option("--head <len>", "前面几个")
      .option("-g, --get", "获取")
      .action(() => {
        new Tag().main(datas, options);
      });
  })
  
}
