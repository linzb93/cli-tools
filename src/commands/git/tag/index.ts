import clipboard from "clipboardy";
import BaseCommand from "@/util/BaseCommand";
import deleteTag from "./delete";
import readPkg from "read-pkg";
import { last } from "lodash-es";

interface Options {
  delete?: boolean;
  silent?: boolean;
  last?: boolean;
  get?: boolean;
}

class Tag extends BaseCommand {
  private options: Options;
  private datas: string[];
  constructor(datas: string[], options: Options) {
    super();
    this.options = options;
    this.datas = datas;
  }
  async run(): Promise<void> {
    const { options } = this;
    if (options.delete) {
      deleteTag();
      return;
    }
    const gitTags = await this.git.tag();
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
      await this.helper.sequenceExec([
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
    const gitTags = await this.git.tag();
    if (gitTags.length === 0) {
      return "";
    }
    const lastTag = this.gitCurrentLatestTag(gitTags);
    const [firstNum, secondNum, thirdNum, lastNum] = lastTag.replace(/^v/, '').split('.');
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

function tag(datas: string[], options: Options): void {
  new Tag(datas, options).run();
}

export default tag;

export const generateNewestTag = () => {
  return new Tag([], {}).generateNewestTag();
};
