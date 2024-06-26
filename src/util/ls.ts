import fs from "fs-extra";
import prettier from "prettier";
import { get as objectGet, set as objectSet, isBoolean } from "lodash-es";
import path from "node:path";
import { BaseType } from "./types";
import { root } from "./helper";

const { readJSONSync, writeFileSync } = fs;
const resolve = (src: string) => path.resolve(root, src);

export default {
  get(key: string) {
    const data = readJSONSync(resolve("./config.secret.json"));
    return objectGet(data, key);
  },
  set(key: string, value: BaseType) {
    const data = readJSONSync(resolve("./config.secret.json"));
    const originValue = objectGet(data, key);
    let ret: BaseType;
    if (value === "!" && isBoolean(originValue)) {
      objectSet(data, key, !originValue);
      ret = !originValue;
    } else {
      objectSet(data, key, value);
      ret = value;
    }
    writeFileSync(
      resolve("./config.secret.json"),
      prettier.format(JSON.stringify(data), {
        parser: "json",
      })
    );
    return ret;
  },
};
