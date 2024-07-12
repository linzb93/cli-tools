import BaseCommand from "@/util/BaseCommand";
import Table from "cli-table3";
import fs from "fs-extra";
import pMap from "p-map";
import { globby } from "globby";
import chalk from "chalk";

// 不同类型的项目，文件最大行数不同
const maxMap = new Map();
maxMap.set("default", {
  warning: 200,
  danger: 300,
});
maxMap.set("vue", {
  warning: 500,
  danger: 700,
});

const table = new Table({
  head: ['', chalk.green("文件地址"), chalk.green("行数")],
  colAligns: ["left", "left", "center"],
});

class Analyse extends BaseCommand {
  constructor(private data: string[]) {
    super();
  }
  async run() {
    this.spinner.text = "正在分析";
    const { files, max } = await this.getMatchFiles();
    const accumulator = await pMap(files, async (file) => {
      const content = await fs.readFile(file, "utf8");
      const lineLength = this.helper.splitByLine(content).length;
      let type = "normal";
      if (lineLength > max.danger) {
        type = "danger";
      } else if (lineLength > max.warning) {
        type = "warning";
      }
      return {
        file,
        type,
        lines: lineLength,
      };
    });
    const result = accumulator.filter((item) => item.type !== "normal");
    if (!result.length) {
      this.spinner.succeed("分析完成，代码行数正常");
      return;
    }
    this.spinner.succeed("分析完成");
    table.push(
      ...result
        .sort((prev, next) => (prev.lines > next.lines ? -1 : 1))
        .map((item,index) => {
          return [
            (index + 1).toString(),
            chalk.cyan(item.file),
            item.type === "danger"
              ? chalk.red(item.lines)
              : chalk.yellow(item.lines),
          ];
        })
    );
    console.log(table.toString());
  }
  private async getMatchFiles(): Promise<{
    files: string[];
    max: any;
  }> {
    const prefix = this.data[0];
    try {
      await fs.access("vue.config.js");
      return {
        files: await globby([
          `${prefix ? `${prefix}/` : ""}**/*.vue`,
          "!node_modules",
        ]),
        max: maxMap.get("vue"),
      };
    } catch (error) {}
    return {
      files: await globby([
        `${prefix ? `${prefix}/` : ""}**/*.{js,ts}`,
        "!node_modules",
      ]),
      max: maxMap.get("default"),
    };
  }
}

export default function (data: string[]) {
  return new Analyse(data).run();
}
