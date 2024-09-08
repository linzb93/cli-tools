import Kill, { IOption, Params } from "@/service/kill";
import { generateHelpDoc } from "@/common/helper";
function generateHelp() {
  generateHelpDoc({
    title: "kill",
    content: `根据端口号/进程ID结束任务。
使用方法：
- kill port 8080: 根据端口号结束任务
- kill pid 23019: 根据进程ID结束任务
- kill 9080: 根据端口号或者进程ID结束任务`,
  });
}

export default async (args: Params, options?: IOption) => {
  if (options.help) {
    generateHelp();
    return;
  }
  await new Kill().main(...args);
};
