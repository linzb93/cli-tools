import { basename } from "node:path";
import chalk from "chalk";
import Table from "cli-table3";
import BaseCommand from "@/common/BaseCommand";
import useScan from "./useScan";
import progress from "@/common/progress";

const table = new Table({
  head: ["名称", "地址", "状态"],
  colAligns: ["left", "left", "center"],
});

interface ResultItem {
  path: string;
  status: number;
}

export default class extends BaseCommand {
  async main() {
    this.logger.info("开始扫描");
    const { counter$, list$, total$ } = await useScan();
    total$.subscribe((total: number) => {
      progress.setTotal(total);
    });
    counter$.subscribe(() => {
      progress.tick();
    });
    list$.subscribe((list: ResultItem[]) => {
      this.logger.success(`扫描完成`);
      table.push(
        ...list.map((item) => [
          basename(item.path),
          item.path,
          this.getStatusMap(item.status),
        ])
      );
      console.log(table.toString());
      process.exit(0);
    });
  }
  private getStatusMap(status: number) {
    const map = {
      1: chalk.red("未提交"),
      2: chalk.yellow("未推送"),
      3: chalk.green("正常"),
      4: chalk.gray("不在主分支上"),
    };
    return map[status];
  }
}
