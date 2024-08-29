import BaseCommand from "../../shared/BaseCommand";
import { sequenceExec } from '../../shared/promiseFn';
class Pull extends BaseCommand {
  async run() {
    await sequenceExec([
      {
        message: "git pull",
        retryTimes: 20,
      },
    ]);
    this.logger.success("代码拉取成功");
  }
}

export default () => {
  new Pull().run();
};
