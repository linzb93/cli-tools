import Table from "cli-table3";
import BaseCommand from "@/util/BaseCommand";
import useScan from "@/provider/git/useScan";
import { watch } from "@vue/runtime-core";

const table = new Table({
  head: ["地址", "状态"],
  colAligns: ["center", "center"],
});

class Scan extends BaseCommand {
  async run() {
    this.spinner.text = "开始扫描";
    const { counter, total, result, finished } = await useScan();
    watch(finished, () => {
      if (finished.scanDirs) {
        this.spinner.text = `扫描到${total.value}个项目`;
        return;
      }
      if (finished.scanProjects) {
        this.spinner.succeed(`扫描完成`);
        table.push(...result.value.map((item) => [item.path, item.status]));
        console.log(table.toString());
        process.exit(0);
      }
    });
    watch(counter, () => {
      this.spinner.text = `已扫描${counter.value}个项目`;
    });
  }
}

export default () => {
  new Scan().run();
};
