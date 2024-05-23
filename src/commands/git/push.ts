import BaseCommand from "@/util/BaseCommand";

class Pull extends BaseCommand {
  async run() {
    await this.helper.sequenceExec([
      {
        message: "git push",
        retries: 20,
      },
    ]);
    this.logger.success("代码推送成功");
  }
}

export default () => {
  new Pull().run();
};
