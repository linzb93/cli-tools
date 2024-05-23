import fs from "fs-extra";
import path from "node:path";
import { root } from "./helper";
export default () => {
  if (!fs.existsSync(path.resolve(root, "temp"))) {
    fs.mkdirsSync(path.resolve(root, "temp"));
  }
};
