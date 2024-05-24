import BaseCommand from "@/util/BaseCommand";
import clone from "./clone";
import deploy from "./deploy";
import pull from "./pull";
import push from "./push";
import remove from "./remove";
import rename from "./rename";
import reset from "./reset";
import scan from "./scan";
import tag from "./tag";
class Home extends BaseCommand {
  constructor(
    private subCommand: string,
    private data: string[],
    private options: any
  ) {
    super();
  }
  run() {
    const { subCommand, data, options } = this;
    if (subCommand === "clone") {
      clone(data, options);
      return;
    }
    if (subCommand === "deploy") {
      deploy(data, options);
      return;
    }
    if (subCommand === "pull") {
      pull();
      return;
    }
    if (subCommand === "push") {
      push();
      return;
    }
    if (subCommand == "scan") {
      scan();
      return;
    }
    if (subCommand === "remove") {
      remove();
      return;
    }
    if (subCommand === "rename") {
      rename();
      return;
    }
    if (subCommand === "reset") {
      reset(data[0]);
      return;
    }
    if (subCommand === "tag") {
      tag(data, options);
      return;
    }
  }
}

export default function (subCommand: string, data: string[], options: any) {
  new Home(subCommand, data, options).run();
}
