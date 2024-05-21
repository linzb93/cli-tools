/* eslint-disable no-redeclare */
import { execaCommand as execa } from "execa";
import { isPlainObject, get } from "lodash-es";
import cheerio, { load, CheerioAPI, Node as CheerioNode } from "cheerio";
import axios from "axios";
import inquirer from "./inquirer.js";
import fs from "fs-extra";
import readPkg from "read-pkg";

/**
 * npm public API: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
 * or cnpm: https://registry.npmmirror.com/ 版本号支持缩写
 */
interface InstallOptions {
  devDependencies?: boolean;
  dependencies?: boolean;
  global?: boolean;
  cwd?: string;
}
async function install(name: string): Promise<void>;
async function install(name: string, options: InstallOptions): Promise<void>;
async function install(options: InstallOptions): Promise<void>;
async function install(...args: any[]) {
  let pkgName = "";
  let options: InstallOptions = {};
  if (args.length === 1) {
    if (isPlainObject(args[0])) {
      options = args[0];
    } else if (typeof args[0] === "string") {
      pkgName = args[0];
    }
  } else if (args.length === 2) {
    pkgName = args[0];
    options = args[1];
  }
  const {
    devDependencies,
    dependencies,
    global: optGlobal,
    ...restOpts
  } = options;
  const params = ["install"];
  if (pkgName) {
    params.push(pkgName);
    if (dependencies) {
      params.push("-S");
    } else if (devDependencies) {
      params.push("-D");
    } else if (optGlobal) {
      params.push("-g");
    }
  }
  await execa(`npm ${params.join(" ")}`, restOpts);
}

interface RegData {
  description: string;
}
// 本来CheerioNode上应该有data属性的，但作者没写。
interface ExtCheerioNode extends CheerioNode {
  data: string;
}

export class Npm {
  private $: CheerioAPI;
  private regData: RegData;
  constructor($: CheerioAPI, regData: RegData) {
    this.$ = $;
    this.regData = regData;
  }
  get(type: string): string {
    const { $ } = this;
    if (type === "repository") {
      return $("#repository").next().find("a").attr("href") as string;
    }
    if (type === "weeklyDl") {
      return $("._9ba9a726").text();
    }
    if (type === "lastPb") {
      return $(".f2874b88 time").text();
    }
    if (type === "description") {
      return this.regData.description;
    }
    if (type === "version") {
      return $(".f2874b88.fw6.mb3.mt2.truncate").eq(2).text();
    }
    return "";
  }
}
async function getPage(pkg: string): Promise<Npm> {
  let html = "";
  try {
    const [htmlRes, registryRes] = await Promise.all([
      axios.get(`https://www.npmjs.com/package/${pkg}`),
      axios.get(`https://registry.npmjs.com/${pkg}/latest`),
    ]);
    html = htmlRes.data;
    const $ = load(html);
    return new Npm($, registryRes.data);
  } catch (e) {
    // 没找到
    if (get(e, "response.status") === 404) {
      let res = await axios.get(`https://www.npmjs.com/search?q=${pkg}`);
      html = res.data;
      const $ = load(html);
      const list = $(".d0963384")
        .find(".db7ee1ac")
        .filter((index) => index <= 10)
        .map((_, item) => (item.children[0] as ExtCheerioNode).data);
      const choices = Array.prototype.slice.call(list);
      if (choices.length) {
        throw new Error("检测到您输入的npm依赖有误");
      }
      const { pkgAns } = await inquirer.prompt([
        {
          type: "list",
          name: "pkgAns",
          message: "检测到您输入的npm依赖有误，请选择下面其中一个",
          choices,
        },
      ]);
      res = await axios.get(`https://www.npmjs.com/package/${pkgAns}`);
      html = res.data;
      return new Npm(load(html), { description: "" });
    } else {
      throw e;
    }
  }
}

const shouldUseYarn = () => {
  try {
    fs.accessSync("yarn.lock");
  } catch {
    return false;
  }
  return true;
};

function getVersion(packageName: string): string {
  const match = packageName.match(/@([0-9a-z\.\-]+)@/);
  return match ? (match as RegExpMatchArray)[1] : "";
}

async function getList(name: string) {
  const dirs = await fs.readdir("node_modules");
  try {
    await import(name);
  } catch (error) {
    return {
      list: [],
      versionList: [],
    };
  }
  if (shouldUseYarn()) {
    return {
      list: [name],
      versionList: [
        (
          await readPkg({
            cwd: `node_modules/${name}`,
          })
        ).version,
      ],
    };
  }
  const matches = dirs.filter((dir) =>
    dir.startsWith(`_${name.startsWith("@") ? name.replace("/", "_") : name}@`)
  );
  if (!matches.length) {
    return {
      list: [name],
      versionList: [
        (
          await readPkg({
            cwd: `node_modules/${name}`,
          })
        ).version,
      ],
    };
  }
  return {
    list: matches,
    versionList: matches.map((item) => getVersion(item)),
  };
}

const npm = {
  install,
  getPage,
  getVersion,
  getList,
  Npm,
};
export default npm;
