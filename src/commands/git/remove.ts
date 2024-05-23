import BaseCommand from "@/util/BaseCommand";
import del from "del";
class Remove extends BaseCommand {
  async run() {
    await del(".git");
    this.logger.success("git已删除");
  }
}

export default () => {
  new Remove().run();
};
