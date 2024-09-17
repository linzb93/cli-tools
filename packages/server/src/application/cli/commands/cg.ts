import Cg, { Options } from "@/service/cg";
import { generateHelpDoc } from "@/common/helper";
import chalk from "chalk";

function generateHelp() {
  generateHelpDoc({
    title: "cg",
    content: `
公司冲高业绩查看。达到设定目标时会有弹窗提醒。
使用方法：
${chalk.cyan("cg --realtime")}
其他命令：
- cg get: 获取当前业绩。
- cg user: 获取所有人的预测结果。
选项：
- full: 同时显示当前业绩和所有人的预测结果，否则只显示预测结果。
- cg set [price]: 设置当日的预测业绩。
    `,
  });
}
export default (action: string, data: string, options: Options) => {
  if (options.help) {
    generateHelp();
  }
  new Cg().main(action, data, options);
};
