import BaseCommand from "@/common/BaseCommand";
import deleteAction from "./batchDelete";
import * as git from "@/common/git";

export default class extends BaseCommand {
  async main() {
    deleteAction({
      name: "分支",
      choices: (await git.getBranchs()).filter((branch) =>
        ["master", "main", "release"].includes(branch)
      ),
      deleteFn: git.deleteBranch,
    });
  }
}
