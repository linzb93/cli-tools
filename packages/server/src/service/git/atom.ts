import {
  CommandItem,
  sequenceExec,
} from "../../application/cli/shared/promiseFn";
import inquirer from "@/application/cli/shared/inquirer";

async function handleConflict() {
  const { resolved } = await inquirer.prompt([
    {
      message: "代码合并失败，检测到代码有冲突，是否已解决？",
      type: "confirm",
      default: true,
      name: "resolved",
    },
  ]);
  if (!resolved) {
    throw new Error("exit");
  }
  await sequenceExec(["git add .", "git commit -m conflict-fixed"]);
}
interface GitAtomMap {
  [key: string]: (...params: any[]) => string | CommandItem;
}
const gitAtom: GitAtomMap = {
  commit(message: string) {
    const msg = message ? `feat:${message}` : `feat:update`;
    return {
      message: msg,
      onError: handleConflict,
    };
  },
  pull() {
    return {
      message: "git pull",
      onError: () => {},
    };
  },
  push() {
    return {
      message: "git push",
      onError: () => {},
    };
  },
  merge(branch: string) {
    return {
      message: `git merge ${branch}`,
      onError: handleConflict,
    };
  },
};
export default gitAtom;
