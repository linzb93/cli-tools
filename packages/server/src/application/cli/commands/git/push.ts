import BaseCommand from "../../shared/BaseCommand";
import { sequenceExec } from '../../shared/promiseFn';

class Pull extends BaseCommand {
  async run() {
    await sequenceExec([
      {
        message: "git push",
        retryTimes: 20,
      },
    ]);
    this.logger.success("代码推送成功");
  }
}

export default () => {
  new Pull().run();
};
