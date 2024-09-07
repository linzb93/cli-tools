import { fork } from "node:child_process";
import { resolve } from "node:path";
import BaseCommand from "@/common/BaseCommand";
import { root } from "@/common/constant";
import Kill from "../kill";
import detectPort from "detect-port";
import inquirer from "@/common/inquirer";
import globalConfig from "../../../../../config.json";
import open from "open";
import sql from "@/common/sql";
export interface Options {
  menus: boolean | string;
  open: boolean;
}

export default class extends BaseCommand {
  async main(command: string, options: Options) {
    const port = globalConfig.port.production;
    if (command === "stop") {
      new Kill().main(["port", port.toString()]);
      return;
    }
    if ((await detectPort(port)) !== port) {
      console.log("服务已启动，无需重新打开");
      await this.openPage(options);
      return;
    }
    console.log("正在启动服务器");
    const child = fork(resolve(root, "packages/server/dist/web.js"), [], {
      detached: true,
      stdio: [null, null, null, "ipc"],
    });
    child.on("message", async () => {
      console.log(`服务在${globalConfig.port.production}端口启动。`);
      await this.openPage(options);
      child.unref();
      child.disconnect();
      process.exit(0);
    });
    child.on("error", (error) => {
      console.log(error);
      process.exit(1);
    });
  }
  private async openPage(options: Options) {
    if (options.open) {
      await open(
        `http://localhost:${globalConfig.port.production}/${globalConfig.prefix.static}`
      );
      return;
    }
    if (options.menus) {
      const menus = await sql((db) => db.menus);
      let menu = "";
      if (options.menus === true && menus && menus.length) {
        const { answer } = await inquirer.prompt({
          type: "list",
          name: "answer",
          message: "请选择要打开的菜单",
          choices: menus.map((menu) => ({
            name: menu.title,
            value: menu.to,
          })),
        });
        menu = answer;
      } else {
        menu = options.menus as string;
      }
      await open(
        `http://localhost:${globalConfig.port.production}/${globalConfig.prefix.static}/#${menu}`
      );
    }
  }
}
