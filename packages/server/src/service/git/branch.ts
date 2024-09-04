import chalk from "chalk";
import BaseCommand from "@/common/BaseCommand";
import deleteAction from "./batchDelete";
import { getBranches, deleteBranch } from "@/common/git";

export default class extends BaseCommand {
  async main() {
    deleteAction({
      name: "分支",
      choices: (await getBranches())
        .filter(
          (branchItem) =>
            !["master", "main", "release"].includes(branchItem.name)
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
            value: item.name,
          };
        }),
      deleteFn: deleteBranch,
    });
  }
}
