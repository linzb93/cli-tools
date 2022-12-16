import clipboard from 'clipboardy';
import BaseCommand from '../../../util/BaseCommand.js';
import deleteTag from './delete.js';
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
          .join('\n')}`
      );
      return;
    }
    const last = gitTags.slice(-1)?.[0];
    if (options.get) {
      if (!gitTags.length) {
        this.logger.success('该项目没有tag');
      } else {
        this.logger.success(last);
        clipboard.writeSync(last);
      }
    } else {
      let output = '';
      const input = this.datas[0];
      if (!input) {
        output = await this.getNewestTag({
          major: this.datas[0] === 'major',
          minor: this.datas[0] === 'minor'
        });
      } else {
        output = input.startsWith('v') ? input : `v${input}`;
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
  async getNewestTag(opt?: {
    major: boolean;
    minor: boolean;
  }): Promise<string> {
    const gitTags = await this.git.tag();
    const matchTag = gitTags.slice(-1)[0];
    const firstNum = Number(matchTag.slice(1, 2)[0]);
    const secondNum = Number((matchTag.match(/v\d\.(\d)/) as string[])[1]);
    const thirdNum = Number((matchTag.match(/v(\d\.){2}(\d)/) as string[])[2]);
    const lastNum = Number((matchTag.match(/v[\d\.]{2,}(\d)/) as string[])[1]);
    if (opt?.major) {
      // 第二位数字+1，第三位置为0，保留三位数
      if (secondNum === 9) {
        return `${firstNum + 1}.0.0`;
      }
      return `${firstNum}.${secondNum + 1}.0`;
    }
    if (opt?.minor) {
      // 第三位数字+1，保留三位数
      return `${firstNum}.${secondNum}.${thirdNum + 1}`;
    }
    if (matchTag.split('.').length === 3) {
      return `${matchTag}.1`;
    }
    return `${firstNum}.${secondNum}.${thirdNum}.${lastNum + 1}`;
  }
}

function tag(datas: any[], options: Options): void {
  new Tag(datas, options).run();
}

export default tag;

export const getNewestTag = (data: string) => {
  return new Tag([], {}).getNewestTag({
    minor: data === 'minor',
    major: data === 'major'
  });
};
