import clipboard from "clipboardy";
import readPkg from "read-pkg";
import { last } from "lodash-es";
import pMap from "p-map";
import BaseCommand from "@/common/BaseCommand";
import {getTags, deleteTag} from "./shared";
import { sequenceExec } from "@/common/promiseFn";
import gitAtom from "./atom";

export interface Options {
  /**
   * @default false
   * 是否进入批量删除标签模式
   */
  delete?: boolean;
  /**
   * 获取最后几个标签
   */
  last?: boolean;
  /**
   * 输出标签，默认行为是打标签
   */
  get?: boolean;
  help?: boolean;
  /**
   * 获取前面几个标签，在批量删除标签模式使用
   */
  head: number;
}

export default class extends BaseCommand {
  async main(data: string[], options: Options) {
    if (options.delete) {
      await this.batchDelete(options);
      return;
    }
    const gitTags = await getTags();
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
      return;
    }
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
  /**
   * 生成最新的tag
   */
  async generateNewestTag(): Promise<string> {
    const gitTags = await getTags();
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
  /**
   * 批量删除分支
   */
  private async batchDelete(options: Options) {
    this.spinner.text = "正在获取所有标签";
    await sequenceExec([
      gitAtom.pull()
    ]);
    const tags = await getTags();
    if (!tags) {
      this.spinner.succeed("没有标签需要删除");
      return;
    }
    let selected: string[] = [];
    if (options.head) {
      this.spinner.stop();
      const list = tags.slice(0, Number(options.head));
      this.logger.info(`您需要删除的标签有：${list.join(",")}`);
      const answer = await this.inquirer.prompt({
        message: "确认删除？",
        type: "confirm",
        name: "is",
      });
      if (answer.is) {
        selected = list;
      }
    } else {
      const answer = await this.inquirer.prompt({
        message: "请选择要删除的标签",
        type: "checkbox",
        choices: tags,
        name: "selected",
      });
      selected = answer.selected;
    }
    if (!selected.length) {
      this.spinner.fail("您没有选择任何标签，已退出");
      return;
    }
    this.spinner.text = "开始删除";
    await pMap(
      selected,
      async (item: string) => {
        await deleteTag(item);
        try {
          deleteTag(item, { remote: true });
        } catch (error) {
          return;
        }
      },
      { concurrency: 3 }
    );
    this.spinner.succeed("删除成功");
  }
}
