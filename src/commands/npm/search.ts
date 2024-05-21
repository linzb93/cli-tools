import open from "open";
import chalk from "chalk";
import Table from "cli-table3";
import { AxiosError } from "axios";
import BaseCommand from "../../util/BaseCommand.js";
const table = new Table({
  head: [
    chalk.green("名称"),
    chalk.green("简介"),
    chalk.green("周下载量"),
    chalk.green("上次更新"),
    chalk.green("最新版本"),
  ],
  colAligns: ["center", "center", "center", "center", "center"],
});
interface Options {
  open?: boolean;
}
interface OutputPkgItem {
  name: string;
  description: string;
  weeklyDl: string;
  lastPb: string;
}
class Search extends BaseCommand {
  private args: string[];
  private options: Options;
  constructor(args: string[], options: Options) {
    super();
    this.args = args;
    this.options = options;
  }
  async run() {
    const { args, options } = this;
    if (args.length === 1) {
      return this.fetchNpmPackage(args[0], false, options);
    } else if (args.length > 1) {
      return this.fetchMulNpmPackage(args);
    } else {
      this.logger.error("未检测到依赖名称。");
    }
  }
  // 获取单个包信息
  private async fetchNpmPackage(
    packageName: string,
    isMultiple: boolean,
    options: Options = {}
  ): Promise<OutputPkgItem> {
    const { spinner } = this;
    if (!isMultiple) {
      spinner.text = `正在查找 ${packageName} 模块`;
    }
    const page = await this.npm.getPage(packageName);
    const data = {
      name: packageName,
      description: page.get("description"),
      weeklyDl: page.get("weeklyDl"),
      lastPb: page.get("lastPb"),
      version: page.get("version"),
    };
    data.weeklyDl = this.transformNumberCn(data.weeklyDl).toString();
    if (isMultiple || process.env.VITEST) {
      return data;
    }
    spinner.stop();
    console.log(`${chalk.bold(`关于${packageName}`)}:
        ${data.description}
      周下载量：${chalk.green(data.weeklyDl)}
      上次更新：${chalk.green(data.lastPb)}`);
    if (options.open) {
      await open(`https://npmjs.com/package/${packageName}`);
    }
    return data;
  }
  // 获取多个包信息并比较
  private async fetchMulNpmPackage(args: string[]) {
    const { spinner } = this;
    spinner.text = `正在查找 ${args.join(" ")} 这些模块`;
    let resList;
    try {
      resList = await Promise.all(
        args.map((arg) => this.fetchNpmPackage(arg, true))
      );
    } catch (error) {
      const err = error as AxiosError;
      if (err.response && err.response.statusText === "Not Found") {
        spinner.fail(
          `没有 ${(err.response.config.url as string)
            .split("/")
            .pop()} 这个模块`
        );
      } else {
        spinner.fail("无法访问");
      }
      process.exit(0);
    }
    spinner.stop();
    table.push(
      ...resList.map((item) => [
        item.name,
        this.lineFeed(item.description),
        item.weeklyDl,
        item.lastPb,
        item.version,
      ])
    );
    console.log(table.toString());
  }
  // 12,345,678 => 1234万
  private transformNumberCn(val: string): string {
    const value = Number(val.replace(/,/g, ""));
    if (value > 10000) {
      return `${parseInt((value / 10000).toString())}万`;
    }
    return val;
  }
  private lineFeed(str: string, perLineLength = 30): string {
    const strList = str.split(" ");
    let tempArr: string[] = [];
    const lines = [];
    strList.forEach((s) => {
      tempArr.push(s);
      if (
        tempArr.reduce((sum, item) => sum + item + " ", "").length >
        perLineLength
      ) {
        lines.push(tempArr.join(" "));
        tempArr = [];
      }
    });
    if (tempArr.length) {
      lines.push(tempArr.join(" "));
    }
    return lines.join("\n");
  }
}

export default async (args: string[], options: Options) => {
  return new Search(args, options).run();
};
