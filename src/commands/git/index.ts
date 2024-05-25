import clone from "./clone";
import deploy from "./deploy";
import pull from "./pull";
import push from "./push";
import rename from "./rename";
import reset from "./reset";
import scan from "./scan";
import tag from "./tag";

export default function (subCommand: string, data: string[], options: any) {
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
