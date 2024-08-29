import * as git from '../../../shared/git';
import deleteAction from "../util/delete";

export default async () => {
  deleteAction({
    name: "tag",
    choices: await git.tag(),
    deleteFn: git.deleteTag,
  });
};
