import fs from "node:fs";
import chalk from "chalk";

const commitMap = [
  {
    name: "feat",
    description: "新功能(feature)",
  },
  {
    name: "fix",
    description: "修补bug",
  },
  {
    name: "docs",
    description: "文档(documentation)",
  },
  {
    name: "style",
    description: "样式（不影响代码运行的变动）",
  },
  {
    name: "refactor",
    description: "重构（即不是新增功能，也不是修改bug的代码变动）",
  },
  {
    name: "test",
    description: "增加测试用例",
  },
  {
    name: "chore",
    description: "构建过程或辅助工具的变动",
  },
];
const commitMsgPath = process.argv[2];
const commitMessage = fs.readFileSync(commitMsgPath, "utf8");
if (
  !commitMap
    .map((cmt) => `${cmt.name}:`)
    .find((cmt) => commitMessage.startsWith(cmt))
) {
  // 格式不规范
  console.error("git commit 格式不规范，请参考下面的规范列表进行修改：");
  commitMap.forEach((cmt) => {
    console.log(`${chalk.cyan(`[${cmt.name}]`)}${cmt.description}`);
  });
  process.exit(1);
} else {
  process.exit(0);
}
