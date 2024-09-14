import BaseCommand from "@/common/BaseCommand";
import { join, basename } from "node:path";
import open from "open";
import sql from "@/common/sql";
import fs from "fs-extra";
import globalNpm from "global-modules";
import vscode from "@/common/vscode";
import { isWin } from "@/common/constant";
import { pLocate } from "@/common/promiseFn";

export interface Options {
  name: string;
  reuse: boolean;
  help?: boolean;
}

type RegisterFn = (param?: any) => Promise<string>;
interface OpenItem {
  to: string | RegisterFn;
  type: "editor" | "open";
}

type Map = {
  command: string;
} & OpenItem;

export default class extends BaseCommand {
  private maps: Map[] = [];
  async main(name: string, options: Options) {
    // 本项目
    this.register("cli", {
      type: "editor",
      to: await sql((db) => db.code.cli),
    });
    // 测试用的项目
    this.register("test", {
      type: "editor",
      to: await sql((db) => db.code.tools),
    });
    // npm全局安装目录
    this.register("global", {
      type: "editor",
      to: globalNpm,
    });
    // Windows和macOS命令行文档
    this.register("cmd", {
      type: "open",
      async to() {
        return isWin
          ? "https://www.yuque.com/linzb93/fedocs/rrfmzp"
          : "https://www.yuque.com/linzb93/fedocs/tu3wft";
      },
    });
    // 源代码目录
    this.register("source", {
      type: "editor",
      to: this.openSource(options),
    });

    this.run(name, options);
  }
  private async register(command: string, param: OpenItem) {
    this.maps.push({
      command,
      type: param.type,
      to: param.to,
    });
  }
  private async run(name: string, options: Options) {
    for (const item of this.maps) {
      if (item.command === name) {
        const target = await this.getTarget(item);
        if (item.type === "editor") {
          await vscode.open(target, {
            reuse: options.reuse,
          });
          return;
        }
        await open(target);
        return;
      }
    }
  }
  private openSource(options: Options) {
    return async () => {
      const sourceDir = await sql((db) => db.open.source);
      const dirs = await fs.readdir(sourceDir);
      if (options.name) {
        let matchPath: string;
        try {
          matchPath = await pLocate(
            [
              join(sourceDir, options.name),
              join(sourceDir, `${options.name}.lnk`),
            ],
            async (file: string) => {
              try {
                await fs.access(file);
              } catch (error) {
                throw error;
              }
              return file;
            }
          );
        } catch (error) {
          this.logger.error("项目不存在");
          return;
        }
        const path2 = matchPath;
        return path2;
      } else {
        const { source } = await this.inquirer.prompt([
          {
            type: "list",
            name: "source",
            message: "选择要打开的项目",
            choices: dirs.map((dir) => basename(dir)),
          },
        ]);
        const path2 = join(sourceDir, source);
        return path2;
      }
    };
  }
  private async getTarget(item: Map) {
    if (typeof item.to === "string") {
      return item.to;
    }
    return await item.to();
  }
}
