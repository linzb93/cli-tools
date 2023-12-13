import clipboard from 'clipboardy';
import BaseCommand from '../util/BaseCommand.js';

type Params = [string] | [string, string];
class Kill extends BaseCommand {
  private args: Params;
  constructor(args: Params) {
    super();
    this.args = args;
  }
  async run() {
    const { args } = this;
    clipboard.writeSync(args[0]);
    setTimeout(() => {
      this.logger.success('成功了');
    }, 2000);
  }
}

export default async (args: Params) => {
  await new Kill(args).run();
};
