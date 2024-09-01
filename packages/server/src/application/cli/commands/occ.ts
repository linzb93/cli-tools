import OCC, { Options } from "@/service/occ";
import chalk from "chalk";
import { generateHelpDoc } from "@/common/helper";

function generateHelp() {
  generateHelpDoc({
    title: "occ",
    content: `OCC各平台数据获取。
使用方法：
${chalk.cyan(`occ [appName] [shopId]`)}。
默认是打开美团经营神器测试账号的店铺。
appName 选项：
- jysq: 美团经营神器
- zx: 美团装修神器
- pj: 美团评价神器
- im: 美团IM神器
- yx: 美团营销神器
- dj: 美团点金大师
- ai: 美团AI爆单神器
- ele: 饿了么经营神器
- chain: 连锁品牌
- sg: 闪购
- outer: 站外授权应用

命令行选项：
- token: 获取token
- test: 访问测试站
- pc: 访问PC端应用
- copy: 复制店铺地址
- user: 查看该门店信息
    `,
  });
}

export default (input: string[], options: Options) => {
  if (options.help) {
    generateHelp();
  }
  new OCC().main(input, options);
};
