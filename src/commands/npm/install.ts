import semver, { SemVer } from 'semver';
import axios from 'axios';
import readPkg from 'read-pkg';
import path from 'path';
import { execaCommand as execa } from 'execa';
import fs from 'fs-extra';
import pMap from 'p-map';
import BaseCommand from '../../util/BaseCommand.js';

interface Options {
  dev?: boolean;
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
    if (pkg.startsWith('@daze')) {
      // 这个是下载本地的
      const registry = 'http://ikuai0.haloom.cc:7945';
      const root = this.ls.get('code.project');
      const dirs = await fs.readdir(root);
      this.logger.info(`正在查找${pkg}`);
      await pMap(
        dirs,
        async (dir) => {
          if (!fs.statSync(path.join(root, dir)).isDirectory()) {
            return;
          }
          if (await this.isMonorepo(path.join(root, dir))) {
            const subDirs = await fs.readdir(path.join(root, dir, 'packages'));
            await pMap(
              subDirs,
              async (sub) => {
                try {
                  const cwd = path.join(root, dir, 'packages', sub);
                  const { name } = await readPkg({
                    cwd
                  });
                  if (name === pkg) {
                    this.logger.success(`找到${pkg}，位置是${cwd}`);
                    this.logger.info(
                      `正在下载${path.relative(process.cwd(), cwd)}`
                    );
                    await execa(
                      `npm i ${path.relative(
                        process.cwd(),
                        cwd
                      )} --registry=${registry}`
                    );
                    this.logger.success(`${pkg}下载成功`);
                    process.exit(0);
                  }
                } catch (error) {
                  return;
                }
              },
              { concurrency: 3 }
            );
          } else {
            try {
              const { name } = await readPkg({
                cwd: path.join(root, dir)
              });
              if (name === pkg) {
                await execa(
                  `npm i ${path.join(root, dir)} --registry=${registry}`
                );
                this.logger.success(`${pkg}下载成功`);
                process.exit(0);
              }
            } catch (error) {
              return;
            }
          }
        },
        { concurrency: 3 }
      );
      this.logger.error('未找到匹配的项目');
    } else {
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
  }
  private async isMonorepo(folder: string) {
    const dirs = await fs.readdir(folder);
    return dirs.includes('lerna.json');
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
