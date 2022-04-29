import clipboard from 'clipboardy';
import BaseCommand from '../../../util/BaseCommand.js';
import deleteTag from './delete.js';

interface Options {
  delete?: boolean;
  silent?: boolean;
  latest?: boolean;
  type: 'update' | 'patch';
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
    this.logger.success(last);
    clipboard.writeSync(last);
    return last;
  }
}
/* eslint-disable no-redeclare */
function tag(_: any, option: Options): Promise<string>;
function tag(options: Options): Promise<string>;
function tag(...data: any[]): Promise<string> {
  if (data.length === 2) {
    return new Tag(data[1]).run();
  } else {
    return new Tag(data[0]).run();
  }
}

export default tag;
