import clipboard from "clipboardy";
import BaseCommand from "../../../shared/BaseCommand";
import deleteTag from "./delete";
import readPkg from "read-pkg";
import { last } from "lodash-es";
import * as git from '../../../shared/git';
import { sequenceExec } from "../../../shared/promiseFn";
import * as helper from '../../../shared/helper';
interface Options {
  delete?: boolean;
  last?: boolean;
  get?: boolean;
  help?: boolean;
}

class Tag extends BaseCommand {
  constructor(private datas: string[], private options: Options) {
    super();
  }
  async run() {
    const { options } = this;
    if (options.help) {
      this.generateHelp();
      return;
    }
    if (options.delete) {
      deleteTag();
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
      const input = this.datas[0];
      if (!input) {
        output = await this.generateNewestTag();
      } else {
        output = input.startsWith("v") ? input : `v${input}`;
      }
      await sequenceExec([
        `git tag ${output}`,
        `git push origin ${output}`,
      ]);
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
  private generateHelp() {
    helper.generateHelpDoc({
      title: "git tag",
      content: `git项目获取、添加、删除tag。建议tag的格式是"v" + 版本号
使用方法：
打tag：git tag v2.1.1.2
获取最近10个tag: git tag --last=10。没有这个选项的话就是获取所有的tag。
参数：
- delete: 删除tag，包括本地和远端的
- last=: 获取最近几个tag
- get: 获取并复制最近的一次tag`,
    });
  }
}

function tag(datas: string[], options: Options): void {
  new Tag(datas, options).run();
}

export default tag;

export const generateNewestTag = () => {
  return new Tag([], {}).generateNewestTag();
};
