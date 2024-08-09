import { basename } from 'node:path'
import open from "open";
import readPkg from "read-pkg";
import notifier from "node-notifier";
import { CommandItem } from "@/util/promiseFn";
import BaseCommand from "@/util/BaseCommand";
import { generateNewestTag } from "../tag";
import clipboard from "clipboardy";
import chalk from "chalk";

interface CommandOptions {
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
type GitActions = ('merge' | 'open' | 'copy' | 'tag')[];
interface FlowOption {
  condition: Boolean;
  actions?: GitActions;
  action?: Function;
  inquire?: boolean;
  targetBranch?: string;
  alertWhenError?: boolean;
}
// git代码部署流程
class Deploy extends BaseCommand {
  constructor(private data: string[], private options: CommandOptions) {
    super();
  }
  async run() {
    const { data, options } = this;
    if (options.help) {
      this.generateHelp();
      return;
    }
    const remoteUrl = await this.git.remote();
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
      },
      {
        // github项目
        condition: remoteUrl.includes("github.com"),
        alertWhenError: true,
      },
      {
        // 测试阶段，从开发分支提交到release分支
        condition: targetBranch === "release" && isDevBranch, // dev -> release
        actions: ['merge', 'open'],
        targetBranch
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
        // dev -> master
        condition: isDevBranch && targetBranch === "master",
        inquire: true,
        actions: ['tag', 'copy'],
      },
      {
        // master -> master
        condition: targetBranch === curBranch && curBranch === "master",
        actions: ['tag', 'copy'],
      },
    ]);
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
    flowList: FlowOption[]
  ): void {
    for (const flow of flowList) {
      if (flow.condition) {
        if (typeof flow.action === 'function') {
          flow.action.call(this);
          return;
        }
        this.doAction(flow);
      }
    }
  }
  private async doAction(flow: FlowOption) {
    const { actions, inquire, targetBranch } = flow;
    const flows: (string | CommandItem)[] = [...this.getBaseAction()];
    const tailFlows = [];
    let tag = '';
    const curBranch = await this.git.getCurrentBranch();
    if (inquire) {
      const { answer } = await this.helper.inquirer.prompt({
        message: `确认更新到${targetBranch}分支？`,
        name: "answer",
        type: "confirm",
      });
      if (!answer) {
        return;
      }
    }
    if (actions.includes('merge')) {
      flows.push(
        `git checkout ${targetBranch}`,
        {
          message: `git pull`,
          onError: this.handleConflict
        },
        {
          message: `git merge ${curBranch}`,
          onError: this.handleConflict
        },
        'git push'
      );
      tailFlows.push(`git checkout ${curBranch}`);
    }
    if (actions.includes('tag')) {
      tag = await generateNewestTag();
      flows.push(`git tag ${tag}`);
    }
    if (actions.includes('open')) {
      await this.openDeployPage();
    }
    if (actions.includes('copy')) {
      await this.deploySuccess(tag);
    }
    try {
      await this.helper.sequenceExec([...flows, ...tailFlows]);
    } catch (error) {
      if (flow.alertWhenError) {
        notifier.notify({
          title: "mycli通知",
          message: `${basename(process.cwd())}项目更新失败！`,
        });
      }
    }
    if (!actions.includes('copy')) {
      this.logger.success("部署成功");
    }
  }
  private getBaseAction() {
    return [
      "git add .",
      `git commit -m ${this.options.commit || "update"}`,
      "git pull",
      "git push"
    ]
  }
  private async handleConflict() {
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
- 部署至Github
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
export default (data: string[], options: CommandOptions) => {
  new Deploy(data, options).run();
};
