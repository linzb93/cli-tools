import * as git from "@/util/git";
import deleteAction from "../util/delete";

export default async () => {
  deleteAction({
    name: "tag",
    choices: await git.tag(),
    deleteFn: git.deleteTag,
  });
};
