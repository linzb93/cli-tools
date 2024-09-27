import Ip, { Options } from "@/service/ip";
import { generateHelpDoc } from "@/common/helper";

function generateHelp() {
  generateHelpDoc({
    title: "ip",
    content: `查询本机内网/公网IP，或者查询IP归属地
使用方法：
ip - 查询本机内网和公网IP
ip get '127.0.0.1' - 查询IP归属地`,
  });
}

export default (data: string[], options: Options) => {
  if (options.help) {
    generateHelp();
    return;
  }
  new Ip().main(data);
};
