import { execaCommand as execa } from "execa";

/**
 * 获取代码提交状态
 * @return { number } 1: 未提交；2: 未推送；3: 已推送；4: 不在master/main分支上；0: 状态未知
 */
const getPushStatus = async (
  cwd = process.cwd()
): Promise<0 | 1 | 2 | 3 | 4> => {
  let stdout = "";
  try {
    const data = await execa("git status", {
      cwd,
    });
    stdout = data.stdout;
  } catch (error) {
    return 0;
  }
  if (
    stdout.includes("Changes not staged for commit") ||
    stdout.includes("Changes to be committed")
  ) {
    return 1;
  }
  if (stdout.includes("Your branch is ahead of ")) {
    return 2;
  }
  const currentBranchName = stdout.match(/On branch (\S+)/) as RegExpMatchArray;
  if (!["master", "main"].includes(currentBranchName[1])) {
    return 4;
  }
  if (stdout.includes("nothing to commit")) {
    return 3;
  }
  return 0;
};

export default {
  getPushStatus,
};
