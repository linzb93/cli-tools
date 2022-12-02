import clipboard from 'clipboardy';
import BaseCommand from '../../../util/BaseCommand.js';
import deleteTag from './delete.js';
interface Options {
  delete?: boolean;
  silent?: boolean;
  last?: boolean;
  get?: boolean;
  type: 'update' | 'patch';
}

class Tag extends BaseCommand {
  private options: Options;
  private data: string;
  constructor(data: string[], options: Options) {
    super();
    this.options = options;
    this.data = data[0];
  }
  async run(): Promise<void> {
    const { options } = this;
    if (options.delete) {
      deleteTag();
      return;
    }
    if (options.last) {
      const gitTags = await this.git.tag();
      this.logger.success(
        `找到最近${options.last}个：\n${gitTags
          .slice(-Number(options.last))
          .join('\n')}`
      );
      return;
    }
    const tags = await this.git.tag();
    const last = tags[tags.length - 1];
    if (options.get) {
      if (!last) {
        this.logger.success('该项目没有tag');
      } else {
        this.logger.success(last);
        clipboard.writeSync(last);
      }
    } else {
      let output = '';
      if (!this.data) {
        output = this.detectTag(last, tags);
      } else {
        output = this.detectTag(this.data, tags);
      }
      const { ans } = await this.helper.inquirer.prompt({
        message: `请确认是否打tag：${output}`,
        name: 'ans',
        type: 'confirm'
      });
      if (ans) {
        await this.helper.sequenceExec([
          `git tag ${output}`,
          `git push origin ${output}`
        ]);
        this.logger.success('tag输出成功');
      }
    }
  }
  private detectTag(tagName: string, tags: string[]): string {
    let index = tags.findIndex((tag) => tag === tagName);
    // let tag = tagName;
    const reg = /v[\d\.]{2,}\d/;
    if (tagName.match(reg) === null) {
      // 表示tag名称不合法
      index -= 1;
      while (tags[index].match(reg) === null) {
        index -= 1;
      }
    }
    const matchTag = tags[index];
    let lastNum = Number((matchTag.match(/v[\d\.]{2,}(\d)/) as string[])[1]);
    while (
      tags.find(
        (tag) =>
          tag === `${matchTag.split('.').slice(0, -1).join('.')}.${lastNum + 1}`
      )
    ) {
      lastNum += 1;
    }
    return `${matchTag.split('.').slice(0, -1).join('.')}.${lastNum + 1}`;
  }
}
/* eslint-disable no-redeclare */
function tag(_: any, option: Options): void;
function tag(options: Options): void;
function tag(...data: any[]): void {
  new Tag(data[0], data[1]).run();
}

export default tag;
