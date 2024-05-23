import BaseCommand from "@/util/BaseCommand";

class Reset extends BaseCommand {
  private filename: string;
  constructor(filename: string) {
    super();
    this.filename = filename.replace(/\\/g, "/");
  }
  async run() {
    const { filename } = this;
    const headSecondCommit = await this.git.getHeadSecondCommit();
    await this.git.reset({
      filename,
      id: headSecondCommit,
    });
    this.logger.success("回退成功");
  }
}

export default (filename: string) => {
  new Reset(filename).run();
};
