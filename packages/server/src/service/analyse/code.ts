import BaseCommand from "@/common/BaseCommand";
import Table from "cli-table3";
import fs from "fs-extra";
import pMap from "p-map";
import { globby } from "globby";
import chalk from "chalk";
import { splitByLine } from "@/common/helper";
interface IModule {
  access(): Promise<boolean>;
  maxLength: {
    warning: number;
    danger: number;
  };
  filePattern(prefix: string): string;
  calc(lines: string[]): object;
  render: {
    name: string;
    data(row: any): string;
  }[];
}

const vueModule: IModule = {
  async access() {
    try {
      await fs.access("vue.config.js");
      return true;
    } catch (error) {
      return false;
    }
  },
  maxLength: {
    warning: 500,
    danger: 700,
  },
  filePattern: (prefix) => `${prefix ? `${prefix}/` : ""}**/*.vue`,
  calc(splitLines) {
    const indexes = {
      scriptStart: splitLines.findIndex((line) => line.includes("<script")),
      scriptEnd: splitLines.findIndex((line) => line.includes("</script>")),
      styleStart: splitLines.findIndex((line) => line.includes("<style")),
      styleEnd: splitLines.findIndex((line) => line.includes("</style>")),
    };
    const scriptLength = indexes.scriptEnd - indexes.scriptStart + 1;
    const styleLength = indexes.styleEnd - indexes.styleStart + 1;
    return {
      lines: splitLines.length,
      scriptLength,
      styleLength,
      templateLength: splitLines.length - scriptLength - styleLength,
    };
  },
  render: [
    {
      name: "文件地址",
      data: (row) => chalk.cyan(row.file),
    },
    {
      name: "总行数",
      data: (row) => chalk.cyan(row.lines),
    },
    // {
    //   name: "template行数",
    //   data: (row) => chalk.cyan(row.templateLength),
    // },
    // {
    //   name: "script行数",
    //   data: (row) => chalk.cyan(row.scriptLength),
    // },
    // {
    //   name: "style行数",
    //   data: (row) => chalk.cyan(row.styleLength),
    // },
  ],
};

const javascriptModule: IModule = {
  async access() {
    return true;
  },
  maxLength: {
    warning: 200,
    danger: 300,
  },
  filePattern: (prefix) => `${prefix ? `${prefix}/` : ""}**/*.{js,ts}`,
  calc(splitLines) {
    return {
      lines: splitLines.length,
    };
  },
  render: [
    {
      name: "文件地址",
      data: (row) => chalk.cyan(row.file),
    },
    {
      name: "行数",
      data: (row) => chalk.cyan(row.lines),
    },
  ],
};

const table = new Table({
  head: ["", chalk.green("文件地址"), chalk.green("行数")],
  colAligns: ["left", "left", "center"],
});

export default class extends BaseCommand {
  private modules: IModule[] = [];
  private data: string[];
  addModule(...modules: IModule[]) {
    this.modules = modules;
  }
  async main(prefix: string[]) {
    this.data = prefix;
    this.addModule(vueModule, javascriptModule);
    this.run();
  }
  async run() {
    this.spinner.text = "正在分析";
    const { files, max } = await this.getMatchFiles();
    const accumulator = await pMap(files, async (file) => {
      const content = await fs.readFile(file, "utf8");
      const lineLength = splitByLine(content).length;
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
    const table = new Table({
      head: [chalk.green("文件地址"), chalk.green("行数")],
      colAligns: ["left", "center"],
    });
    table.push(
      ...result
        .sort((prev, next) => (prev.lines > next.lines ? -1 : 1))
        .map((item, index) => {
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
    max: IModule["maxLength"];
  }> {
    const prefix = this.data[0];
    for (const m of this.modules) {
      if (await m.access()) {
        return {
          files: await globby([m.filePattern(prefix), "!node_modules"]),
          max: m.maxLength,
        };
      }
    }
  }
}
