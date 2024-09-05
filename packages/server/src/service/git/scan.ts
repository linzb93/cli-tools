import Table from "cli-table3";
import BaseCommand from "@/common/BaseCommand";
import useScan from "@/common/git/useScan";
import chalk from "chalk";

const table = new Table({
  head: ["地址", "状态"],
  colAligns: ["left", "center"],
});

interface ResultItem {
  path: string;
  status: number;
}

export default class extends BaseCommand {
  async main() {
    this.spinner.text = "开始扫描";
    const [counter$, list$] = await useScan();
    counter$.subscribe(total => {
      this.spinner.text = `扫描到${total}个项目`;
    });
    list$.subscribe((list: ResultItem[]) => {
      this.spinner.succeed(`扫描完成`);
      table.push(...list.map((item) => [item.path, this.getStatusMap(item.status)]));
      console.log(table.toString());
      process.exit(0);
    });
  }
  private getStatusMap(status: number) {
    const map = {
      1: chalk.red('未推送'),
      2: chalk.yellow('未推送'),
      4: chalk.gray('不在主分支上'),
      3: chalk.green('正常')
    }
    return map[status]
  }
}
