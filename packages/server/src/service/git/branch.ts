import chalk from "chalk";
import BaseCommand from "@/common/BaseCommand";
import { getBranches, deleteBranch, ResultItem } from "./shared";
import pMap from "p-map";

export default class extends BaseCommand {
  async main() {
    const branches = (await getBranches())
      .filter(
        (branchItem) => !["master", "main", "release"].includes(branchItem.name)
      )
      .map((item) => {
        let output = item.name;
        if (item.hasLocal && item.hasRemote) {
          output += chalk.cyan("(all)");
        } else if (item.hasLocal) {
          output += chalk.yellow("(local)");
        } else {
          output += chalk.blue("(remote)");
        }
        return {
          name: output,
          value: item,
        };
      });
    let selected: ResultItem[] = [];
    const answer = await this.inquirer.prompt({
      message: "请选择要删除的分支",
      type: "checkbox",
      choices: branches,
      name: "selected",
    });
    selected = answer.selected;
    if (!selected.length) {
      this.logger.error("您没有选择任何标签，已退出");
      return;
    }
    this.spinner.text = "正在删除所选分支";
    const errorBranches: ResultItem[] = [];
    await pMap(
      selected,
      async (branchItem) => {
        // 先删除本地分支，如果成功再删除远端分支
        if (branchItem.hasLocal) {
          try {
            await deleteBranch(branchItem.name);
          } catch (error) {
            errorBranches.push(branchItem);
            return;
          }
        }
        if (branchItem.hasRemote) {
          try {
            await deleteBranch(branchItem.name, { remote: true });
          } catch (error) {
            errorBranches.push(branchItem);
            return;
          }
        }
      },
      { concurrency: 4 }
    );
    this.spinner.stop();
    if (!errorBranches.length) {
      this.logger.success("删除成功");
    } else {
      this.logger.warn(`以下分支没有删除，请确认代码是否已提交或合并：
${errorBranches
  .map((item) => {
    let output = item.name;
    if (item.hasLocal) {
      output += chalk.yellow("(local)");
    } else {
      output += chalk.blue("(remote)");
    }
    return output;
  })
  .join(",")}`);
    }
  }
}
