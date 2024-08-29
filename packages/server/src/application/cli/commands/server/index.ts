import { fork } from "node:child_process";
import { resolve } from "node:path";
import { root } from "@/common/constant";
import kill from "../kill";
import inquirer from "../../shared/inquirer";
import globalConfig from "../../../../../../../config.json";
import sql from "@/common/sql";
interface Options {
  menus: boolean | string;
  open: boolean;
}

export default async (command: string, options: Options) => {
  if (command === "stop") {
    kill(["port", globalConfig.port.production.toString()]);
    return;
  }
  console.log("正在启动服务器");
  let postArgs = [];
  if (options.open) {
    postArgs.push(`--open`);
  }
  if (options.menus) {
    const menus = await sql((db) => db.menus);
    if (!menus.length) {
      //
    } else if (options.menus === true) {
      const { answer } = await inquirer.prompt({
        type: "list",
        name: "answer",
        message: "请选择要打开的菜单",
        choices: menus.map((menu) => ({
          name: menu.title,
          value: menu.to,
        })),
      });
      postArgs.push(`--menu=${answer}`);
    } else {
      postArgs.push(`--menu=${options.menus}`);
    }
  }
  const child = fork(resolve(root, "packages/server/dist/web.js"), postArgs, {
    detached: true,
    stdio: [null, null, null, "ipc"],
  });
  child.on("message", () => {
    console.log(`服务在${globalConfig.port.production}端口启动。`);
    child.unref();
    child.disconnect();
    process.exit(0);
  });
  child.on("error", (error) => {
    console.log(error);
    process.exit(0);
  });
};
