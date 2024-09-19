import { relative } from "node:path";
import semver, { SemVer } from "semver";
import axios from "axios";
import BaseCommand from "@/common/BaseCommand";
import { isPath } from "@/common/helper";
import npm from "./shared";
export interface Options {
  dev?: boolean;
  help?: boolean;
  cjs?: boolean;
}
export default class extends BaseCommand {
  private pkg: string;
  private options: Options;
  async main(pkgs: string[], options: Options) {
    this.pkg = pkgs[0];
    this.options = options;
    const { pkg, spinner } = this;
    if (isPath(pkg)) {
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
      return "latest";
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
}
