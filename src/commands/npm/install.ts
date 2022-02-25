import semver, { SemVer } from 'semver';
import axios from 'axios';
import BaseCommand from '../../util/BaseCommand.js';

interface Options {
  dev?: boolean;
}
// 安装本地依赖至项目中
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
    this.spinner.text = '正在下载';
    const version = await this.getAvailableVersion(pkg);
    const pkgName = `${pkg}@${version}`;
    try {
      await this.npm.install(pkgName, {
        dependencies: !options.dev,
        devDependencies: options.dev
      });
    } catch {
      spinner.fail('无法下载，请检查名称是否有误');
      return;
    }
    spinner.succeed(`${pkgName}下载成功`);
  }
  private async getAvailableVersion(name: string) {
    const { spinner } = this;
    let version = 'latest';
    let type = 'module';
    while (type === 'module') {
      if (version !== 'latest') {
        version = (semver.coerce(semver.major(version) - 1) as SemVer).version;
      }
      const res = await axios.get(
        `https://registry.npmjs.org/${name}/${version}`
      );
      type = res.data.type;
      if (type === 'module') {
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

export default async (pkgs: string[], options: Options) => {
  new Install(pkgs, options).run();
};
