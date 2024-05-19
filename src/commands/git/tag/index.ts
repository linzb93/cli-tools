import clipboard from 'clipboardy';
import BaseCommand from '../../../util/BaseCommand.js';
import deleteTag from './delete.js';
import readPkg from 'read-pkg';
import { last } from 'lodash-es';

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
        output = await this.getNewestTag();
      } else {
        output = input.startsWith('v') ? input : `v${input}`;
      }
      await this.helper.sequenceExec([
        `git tag ${output}`,
        `git push origin ${output}`
      ]);
      const projectConf = await readPkg({
        cwd: process.cwd()
      });
      const jenkins = projectConf.jenkins;
      const ret = `${jenkins.id.replace(/[\-|_]test$/, '')}。${output}`;
      this.logger.success(`部署成功，复制填入更新文档：
      ${ret}`);
      clipboard.writeSync(ret);
    }
  }
  async getNewestTag(): Promise<string> {
    const gitTags = await this.git.tag();
    if (gitTags.length === 0) {
      return '';
    }
    const matchTag = this.gitCurrentLatestTag(gitTags);
    const firstNum = Number(matchTag.slice(1, 2)[0]);
    const secondNum = Number((matchTag.match(/v\d\.(\d+)/) as string[])[1]);
    const thirdNum = Number((matchTag.match(/v(\d\.){2}(\d+)/) as string[])[2]);
    const lastNum = Number((matchTag.match(/(\d+)$/) as string[])[1]);
    if (matchTag.split('.').length === 3) {
      return `${matchTag}.1`;
    }
    return `v${firstNum}.${secondNum}.${thirdNum}.${lastNum + 1}`;
  }
  private gitCurrentLatestTag(tags: string[]): string {
    for (let i = tags.length - 1; i >= 0; i--) {
      if (tags[i].match(/^v\d\./)) {
        const lastNum = Number(last(tags[i].split('.')));
        if (!tags.includes(tags[i].replace(/\d+$/, (lastNum + 1).toString()))) {
          return tags[i];
        }
      }
    }
    return '';
  }
}

function tag(datas: string[], options: Options): void {
  new Tag(datas, options).run();
}

export default tag;

export const getNewestTag = () => {
  return new Tag([], {}).getNewestTag();
};
