import { execaCommand as execa } from "execa";

/**
 * 判断是否是Git项目
 */
export const isGit = async ({ cwd = process.cwd() }): Promise<boolean> => {
  try {
    await execa("git rev-parse --is-inside-work-tree", {
      cwd,
    });
    return true;
  } catch (error) {
    return false;
  }
};

interface CloneOptions {
  url: string;
  branch?: string;
  dirName?: string;
  shallow?: false;
  cwd: string;
}

/**
 * git clone 项目
 */
export const clone = async (options: CloneOptions): Promise<string> => {
  const { url, branch, dirName, shallow, cwd } = options;
  try {
    await execa(
      `git clone${branch ? ` -b ${branch}` : ""} ${url}${
        dirName ? ` ${dirName}` : ""
      }${shallow ? " --depth=1" : ""}`,
      {
        cwd,
        stdio: "ignore",
      }
    );
  } catch (error) {
    throw error;
  }
  return dirName || url.split("/").slice(-1)[0].slice(0, -4);
};

// git pull
export const pull = async ({ cwd = process.cwd() } = {}): Promise<void> => {
  try {
    await execa("git pull", {
      cwd,
    });
  } catch (error) {
    throw error;
  }
};
// git push
export const push = async ({
  cwd = process.cwd(),
  branch = "",
}: {
  cwd?: string;
  branch?: string;
} = {}): Promise<void> => {
  if (branch) {
    await execa("git push", {
      cwd,
    });
  } else {
    await execa(`git push --set-upstream origin ${branch}`);
  }
};

/**
 * 获取远端地址
 * @returns {string} 远端地址
 */
export const remote = async (): Promise<string> => {
  const { stdout: data } = await execa("git remote -v");
  return (data.split(/\n/)[0].match(/http\S+/) as RegExpMatchArray)[0];
};

/**
 * 获取代码提交状态
 * @return { number } 未提交 1；未推送 2；已推送 3；不在master/main分支上 4；状态未知 0
 */
export const getPushStatus = async (
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

/**
 * 获取当前分支名称
 * @returns {string} 分支名称
 */
export const getCurrentBranch = async (): Promise<string> => {
  const { stdout } = await execa("git branch --show-current");
  return stdout;
};
/**
 * 获取最近一次提交记录
 */
export const getHeadSecondCommit = async (): Promise<string> => {
  const { stdout } = await execa("git log --format=oneline -2");
  return stdout.split("\n")[1].split(" ")[0];
};
/**
 * Git代码重置
 */
export const reset = async ({
  filename,
  id,
}: {
  filename: string;
  id: string;
}): Promise<void> => {
  await execa(`git reset ${id} ${filename}`);
  await execa(`git checkout ${id} ${filename}`);
};
/**
 * 获取所有tag
 */
export const tag = async (): Promise<string[]> => {
  const { stdout } = await execa("git tag");
  return stdout === "" ? [] : stdout.split("\n");
};
/**
 * 删除tag
 */
export const deleteTag = async (
  tag: string,
  {
    includeRemote,
    cwd = process.cwd(),
  }: {
    includeRemote?: boolean;
    cwd?: string;
  } = {}
): Promise<void> => {
  if (includeRemote) {
    await execa(`git push origin :refs/tags/${tag}`, { cwd });
  } else {
    await execa(`git tag -d ${tag}`, { cwd });
  }
};

/**
 * 获取分支列表
 */
export const getBranchs = async () => {
  const { stdout } = await execa("git branch --format='%(refname:short)'");
  return stdout.split("\n");
};

/**
 * 删除分支
 */
export const deleteBranch = async (
  branch: string,
  {
    includeRemote,
    cwd = process.cwd(),
  }: {
    includeRemote?: boolean;
    cwd?: string;
  } = {}
): Promise<void> => {
  if (includeRemote) {
    await execa(`git push origin :refs/tags/${tag}`, { cwd });
  } else {
    await execa(`git branch -d ${tag}`, { cwd });
  }
};
