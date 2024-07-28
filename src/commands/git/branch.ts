import * as git from "@/util/git";
import deleteAction from "./util/delete";

export default async () => {
  deleteAction({
    name: "分支",
    choices: (await git.getBranchs()).filter((branch) =>
      ["master", "main", "release"].includes(branch)
    ),
    deleteFn: git.deleteBranch,
  });
};
