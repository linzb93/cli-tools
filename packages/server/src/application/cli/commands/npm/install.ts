import semver, { SemVer } from "semver";
import axios from "axios";
import readPkg from "read-pkg";
import {relative} from "node:path";
import { execaCommand as execa } from "execa";
import fs from "fs-extra";
import pMap from "p-map";
import BaseCommand from "../../shared/BaseCommand";
import * as helper from '../../shared/helper';
import npm from '../../shared/npm';
interface Options {
  dev?: boolean;
  help?: boolean;
  cjs?: boolean;
}
class Install extends BaseCommand {
  private pkg: string;
  private options: Options;
  constructor(pkgs: string[], options: Options) {
    super();
    this.pkg = pkgs[0];
    this.options = options;
  }
  async run() {
    const { pkg, options, spinner } = this;
    if (options.help) {
      this.renderHelp();
      return;
    }
    if (helper.isPath(pkg)) {
      // 是本地的
      const relativePath = relative(pkg, process.cwd());
      npm.install(relativePath);
      return;
    }
    this.spinner.text = "正在下载";
    const version = await this.getAvailableVersion(pkg);
    const pkgName = `${pkg}@${version}`;
    try {
      await npm.install(pkgName, {
        dependencies: !options.dev,
        devDependencies: options.dev,
      });
    } catch {
      spinner.fail("无法下载，请检查名称是否有误");
      return;
    }
    spinner.succeed(`${pkgName}下载成功`);
  }
  private async getAvailableVersion(name: string) {
    if (!this.options?.cjs) {
      return 'latest';
    }
    const { spinner } = this;
    let version = "latest";
    let type = "module";
    while (type === "module") {
      if (version !== "latest") {
        version = (semver.coerce(semver.major(version) - 1) as SemVer).version;
      }
      const res = await axios.get(
        `https://registry.npmjs.org/${name}/${version}`
      );
      type = res.data.type;
      if (type === "module") {
        spinner.text = `检测到当前版本是ESModule类型的，正在向下查找CommonJS版本的V${semver.major(
          version
        )}.x`;
      }
      version = res.data.version;
    }
    spinner.text = `正在下载${name}版本V${semver.major(version)}.x`;
    return semver.major(version);
  }
  private renderHelp() {
    helper.generateHelpDoc({
      title: "npm install",
      content: `为本项目下载某个模块，可以从npm下载，也可以从本地复制。
使用方法：
npm install moduleName: 当参数不是地址格式的时候，判断为线上的npm模块
npm install /path/to/your_module 从本地复制过来
参数：
- -d: 添加到devDependencies中`,
    });
  }
}

export default async (pkgs: string[], options: Options) => {
  new Install(pkgs, options).run();
};
