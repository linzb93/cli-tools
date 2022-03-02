import BaseCommand from '../../util/BaseCommand.js';

class Revert extends BaseCommand {
  private filename: string;
  constructor(filename: string) {
    super();
    this.filename = filename;
  }
  async run() {
    const { filename } = this;
    const headSecondCommit = await this.git.getHeadSecondCommit();
    await this.git.reset({
      filename,
      id: headSecondCommit
    });
    this.logger.success('回退成功');
  }
}

export default (filename: string) => {
  new Revert(filename).run();
};
