/**
 * 公司项目的代码部署到Jenkins测试环境与生产环境，默认测试环境
 * eg:
 * mycli git deploy 测试环境
 * mycli git deploy prod 生产环境
 * 也可以部署github的
 */
import open from "open";
import readPkg from "read-pkg";
import notifier from "node-notifier";
import { CommandItem } from "@/util/promiseFn";
import BaseCommand from "@/util/BaseCommand";
import { generateNewestTag } from "../tag";
import clipboard from "clipboardy";
import chalk from "chalk";

interface Options {
  commit: string;
  tag: string;
  debug: boolean;
  current: boolean;
  help: boolean;
}
interface JenkinsProject {
  name: string;
  id: string;
}

// git代码部署流程
class Deploy extends BaseCommand {
  constructor(private data: string[], private options: Options) {
    super();
  }
  async run() {
    const { data, options } = this;
    if (options.help) {
      this.generateHelp();
      return;
    }
    const remote = await this.git.remote();
    const curBranch = await this.git.getCurrentBranch();
    const isDevBranch = !["release", "master"].includes(curBranch);
    const targetBranch =
      (curBranch === "master" && data[0] === "test") || data[0] !== "prod"
        ? "release"
        : "master";
    this.createSerial([
      {
        // 只提交到当前分支
        condition: this.options.current,
        action: this.deployCurrent,
      },
      {
        // github项目
        condition: remote.includes("github.com"),
        action: this.deployToGithub,
      },
      {
        // 测试阶段，从开发分支提交到release分支
        condition: targetBranch === "release" && isDevBranch, // dev -> release
        action: this.deployToRelease,
      },
      {
        condition: targetBranch === curBranch && curBranch === "release", // release -> release
        action: this.deployCurrent,
      },
      {
        condition: curBranch === "release" && targetBranch === "master", // release -> master
        action: () => {
          this.logger.error(
            "不允许直接从release分支合并到master分支，请从开发分支合并",
            true
          );
        },
      },
      {
        // dev -> master or master -> master
        condition:
          (isDevBranch && targetBranch === "master") ||
          (targetBranch === curBranch && curBranch === "master"),
        action: this.deployToProduction,
      },
    ]);
  }
  private async deployToGithub() {
    const flow: (string | CommandItem)[] = [
      {
        message: "git pull",
        retryTimes: 20,
      },
      {
        message: "git push",
        retryTimes: 20,
      },
    ];
    const gitStatus = await this.git.getPushStatus();
    if (gitStatus === 1) {
      flow.unshift("git add .", {
        message: `git commit -m ${this.getFormattedCommitMessage()}`,
        onError: () => { },
      });
    }
    try {
      await this.helper.sequenceExec(flow);
    } catch (error) {
      this.logger.error((error as Error).message);
      notifier.notify({
        title: "mycli通知",
        message: "Github项目更新失败！",
      });
      return;
    }
    this.logger.success("Github项目更新成功");
  }
  private async deployCurrent() {
    await this.helper.sequenceExec([
      "git add .",
      `git commit -m ${this.options.commit || "update"}`,
      "git pull",
      "git push",
    ]);
    this.logger.success("部署成功");
  }
  private async deployToProduction() {
    const { tag } = this.options;
    const curBranch = await this.git.getCurrentBranch();
    if (curBranch !== "master") {
      const { answer } = await this.helper.inquirer.prompt({
        message: "确认更新到正式站？",
        name: "answer",
        type: "confirm",
      });
      if (!answer) {
        return;
      }
    }

    const gitStatus = await this.git.getPushStatus();
    let flow = [];
    if (gitStatus === 1) {
      flow.push("git add .", {
        message: `git commit -m ${this.getFormattedCommitMessage()}`,
        onError() { },
      });
    }
    flow.push(
      curBranch === "master" ? "" : `git checkout master`,
      {
        message: "git pull",
        onError() { },
      },
      curBranch === "master" ? "" : `git merge ${curBranch}`,
      "git push"
    );
    const newestTag = tag || (await generateNewestTag());
    if (newestTag) {
      flow.push(`git tag ${newestTag}`, `git push origin ${newestTag}`);
    }
    flow = flow.filter((item) => !!item);
    try {
      await this.helper.sequenceExec(flow);
      await this.deploySuccess(newestTag);
    } catch (error) {
      this.logger.error((error as Error).message);
      return;
    }
  }
  private async deployToRelease() {
    const curBranch = await this.git.getCurrentBranch();
    try {
      const flow = [
        "git add .",
        {
          message: `git commit -m ${this.getFormattedCommitMessage()}`,
          onError() { },
        },
        {
          message: "git pull",
          onError() { },
        },
        {
          message: "git push",
          onError() { },
        },
        `git checkout release`,
        "git pull",
        {
          message: `git merge ${curBranch}`,
          onError: async () => {
            const ans = await this.helper.inquirer.prompt([
              {
                message: "代码合并失败，检测到代码有冲突，是否已解决？",
                type: "confirm",
                default: true,
                name: "resolved",
              },
            ]);
            if (!ans.resolved) {
              throw new Error("exit");
            }
            await this.helper.sequenceExec([
              "git add .",
              "git commit -m conflict-fixed",
            ]);
          },
        },
        "git push",
      ];
      flow.push(`git checkout ${curBranch}`);
      await this.helper.sequenceExec(flow);
      await this.openDeployPage();
    } catch (error) {
      this.logger.error((error as Error).message);
      return;
    }
  }
  private async deploySuccess(tag: string) {
    if (!tag) {
      this.logger.success("部署成功");
      return;
    }
    const projectConf = await readPkg({
      cwd: process.cwd(),
    });
    const jenkins = projectConf.jenkins;
    const copyText = `${jenkins.id.replace(/[\-|_]test$/, "")}，${tag}`;
    this.logger.success(`部署成功，复制填入更新文档：
${copyText}`);
    clipboard.writeSync(copyText);
  }
  // commit message 规范化
  private getFormattedCommitMessage() {
    const standardCommitPrefixes = [
      "chore",
      "test",
      "docs",
      "chore",
      "feat",
      "fix",
      "style",
      "refactor",
    ];
    const { commit } = this.options;
    if (
      !commit ||
      !standardCommitPrefixes.includes(commit.split(":")[0])
    ) {
      // 不规范
      return `feat:${commit}`;
    }
    return commit;
  }
  private createSerial(
    flowList: {
      condition: Boolean;
      action: Function;
    }[]
  ): void {
    for (const flow of flowList) {
      if (flow.condition) {
        flow.action.call(this);
        return;
      }
    }
  }
  private async openDeployPage() {
    const pkg = await readPkg({
      cwd: process.cwd(),
    });
    let jenkins: JenkinsProject;
    if (pkg) {
      jenkins = pkg.jenkins;
    }
    if (jenkins) {
      const { name, id } = jenkins;
      await open(
        `http://${this.helper.isWin ? "192.168.0.32:8080" : "218.66.91.50:13379"
        }/view/${name}/job/${id}/`
      );
    }
  }
  private generateHelp() {
    this.helper.generateHelpDoc({
      title: "git deploy",
      content: `一键部署git项目(包括push和tag)，支持以下部署方式：
- 从开发分支合并到测试分支并部署
- 从开发分支合并到主分支并部署
- 从主分支部署
使用方法：
${chalk.cyan("git deploy prod")}
参数：
- prod: 合并到主分支并部署
选项：
- -c/--current: 只push，没有tag
- --commit=: 输入commit内容
- --tag=: 输入tag标签`,
    });
  }
}
export default (data: string[], options: Options) => {
  new Deploy(data, options).run();
};
