import clipboard from 'clipboardy';
import chalk from 'chalk';
import BaseCommand from '../../../util/BaseCommand.js';
import deleteTag from './delete.js';

interface Options {
  delete?: boolean;
  silent?: boolean;
  latest?: boolean;
  type: string;
}

class Tag extends BaseCommand {
  private options: Options;
  constructor(options: Options) {
    super();
    this.options = options;
  }
  async run(): Promise<string> {
    const { options } = this;
    if (options.delete) {
      deleteTag();
      return '';
    }
    const tags = await this.git.tag();
    const last = tags[tags.length - 1];
    if (options.latest) {
      this.logger.success(last);
      return last;
    } else {
      if (tags.length === 0 && options.silent) {
        return '';
      }
      const ret = this.versionInc(last, options.type || 'update');
      if (options.silent) {
        return ret;
      }
      if (ret) {
        this.logger.success(`${chalk.green('[已复制]')}新的tag：${ret}`);
        clipboard.write(ret);
      } else {
        this.logger.info(`上一个版本是${last}，请自行命名新tag`);
      }
    }
    return '';
  }
  private versionInc(version: string, type: string): string {
    console.log(type);
    if (!version.startsWith('v')) {
      return '';
    }
    const versionNum = version.slice(1);
    if (!/[1-9\.][0-9\.]{1,2}[1-9]/.test(versionNum)) {
      return '';
    }
    const versionNumSeg = versionNum.split('.');
    if (type === 'minor') {
      return `v${versionNumSeg[0]}.${Number(versionNumSeg[1]) + 1}.0`;
    } else if (type === 'patch') {
      return `v${versionNumSeg[0]}.${versionNumSeg[1]}.${
        Number(versionNumSeg[2]) + 1
      }`;
    } else if (type === 'update') {
      if (versionNumSeg.length === 3) {
        return `v${versionNum}.1`;
      } else if (versionNumSeg.length === 4) {
        return `v${versionNumSeg
          .map((n, index) =>
            index === versionNumSeg.length - 1 ? Number(n) + 1 : n
          )
          .join('.')}`;
      }
    }
    return '';
  }
}
/* eslint-disable no-redeclare */
function deploy(_: any, option: Options): Promise<string>;
function deploy(options: Options): Promise<string>;
function deploy(...data: any[]): Promise<string> {
  if (data.length === 2) {
    return new Tag(data[1]).run();
  } else {
    return new Tag(data[0]).run();
  }
}

export default deploy;
