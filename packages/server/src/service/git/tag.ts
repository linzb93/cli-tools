import BaseCommand from "@/common/BaseCommand";
import * as git from "@/common/git";
import clipboard from "clipboardy";
import { sequenceExec } from "@/common/promiseFn";
import readPkg from "read-pkg";
import { last } from "lodash-es";
import deleteAction from "./batchDelete";
export interface Options {
  delete?: boolean;
  last?: boolean;
  get?: boolean;
  help?: boolean;
}

export default class extends BaseCommand {
  async main(data: string[], options: Options) {
    if (options.delete) {
      deleteAction({
        name: "tag",
        choices: await git.tag(),
        deleteFn: git.deleteTag,
      });
      return;
    }
    const gitTags = await git.tag();
    // 输出最近几个
    if (options.last) {
      this.logger.success(
        `找到最近${options.last}个：\n${gitTags
          .slice(-Number(options.last))
          .join("\n")}`
      );
      return;
    }
    const last = gitTags.slice(-1)?.[0];
    if (options.get) {
      if (!gitTags.length) {
        this.logger.success("该项目没有tag");
      } else {
        this.logger.success(last);
        clipboard.writeSync(last);
      }
    } else {
      let output = "";
      const input = data[0];
      if (!input) {
        output = await this.generateNewestTag();
      } else {
        output = input.startsWith("v") ? input : `v${input}`;
      }
      await sequenceExec([`git tag ${output}`, `git push origin ${output}`]);
      const projectConf = await readPkg({
        cwd: process.cwd(),
      });
      const jenkins = projectConf.jenkins;
      const ret = `${jenkins.id.replace(/[\-|_]test$/, "")}。${output}`;
      this.logger.success(`部署成功，复制填入更新文档：
${ret}`);
      clipboard.writeSync(ret);
    }
  }
  /**
   * 生成最新的tag
   */
  async generateNewestTag(): Promise<string> {
    const gitTags = await git.tag();
    if (gitTags.length === 0) {
      return "";
    }
    const lastTag = this.gitCurrentLatestTag(gitTags);
    const [firstNum, secondNum, thirdNum, lastNum] = lastTag
      .replace(/^v/, "")
      .split(".");
    if (lastTag.split(".").length === 3) {
      return `${lastTag}.1`;
    }
    return `v${firstNum}.${secondNum}.${thirdNum}.${Number(lastNum) + 1}`;
  }
  /**
   * 获取最近的一次tag
   * @param tags
   * @returns
   */
  private gitCurrentLatestTag(tags: string[]): string {
    for (let i = tags.length - 1; i >= 0; i--) {
      if (tags[i].match(/^v\d\./)) {
        const lastNum = Number(last(tags[i].split(".")));
        if (!tags.includes(tags[i].replace(/\d+$/, (lastNum + 1).toString()))) {
          return tags[i];
        }
      }
    }
    return "";
  }
}
