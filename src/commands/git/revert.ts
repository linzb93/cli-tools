import BaseCommand from '../../util/BaseCommand.js';

class Revert extends BaseCommand {
  private filename: string;
  constructor(filename: string) {
    super();
    this.filename = filename;
  }
  async run() {
    const { filename } = this;
    const firstCommitId = await this.git.firstCommit();
    await this.git.revert({
      filename,
      id: firstCommitId
    });
    this.logger.success('回退成功');
  }
}

export default (filename: string) => {
  new Revert(filename).run();
};
