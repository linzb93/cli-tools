import fs from 'fs-extra';
import glob from 'glob';
import chalk from 'chalk';
import { execaCommand as execa } from 'execa';
import path from 'path';
import lodash from 'lodash';
import pMap from 'p-map';
import { pascalCase } from 'pascal-case';
import BaseCommand from '../../util/BaseCommand';
const { camelCase, kebabCase, filter } = lodash;
const whiteList = ['App.vue', '.otf', '.ttf', '1px.scss', 'README.md'];

// 对所有命名不规范的文件/文件夹，重新命名，并用 git mv 更新
class Rename extends BaseCommand {
  async run() {
    // 只扫描src文件夹里的
    const files = filter(
      glob.sync('src/**/*'),
      (file) => !whiteList.find((item) => file.endsWith(item))
    );
    pMap(
      files,
      async (file) => {
        const stat = fs.statSync(file);
        let filename;
        if (stat.isDirectory()) {
          filename = path.basename(file);
          if (!this.isCamelCase(filename)) {
            await this.doAction(
              camelCase(path.join(file, '../', filename)),
              file
            );
          }
        } else {
          filename = path.basename(file).split('.')[0];
          const extname = path.extname(file);
          // TODO: 要转换的是文件名，不是整个路径
          if (extname === '.js') {
            if (this.isPascalCase(filename)) {
              //
            } else if (
              this.isConfigJS(filename) &&
              !this.isKebabCase(filename)
            ) {
              await this.doAction(
                path.join(file, '../', `${kebabCase(filename)}.js`),
                file
              );
            } else if (!this.isCamelCase(filename)) {
              await this.doAction(
                path.join(file, '../', `${camelCase(filename)}.js`),
                file
              );
            }
          } else if (extname === '.vue') {
            if (this.isVuePage(file)) {
              if (!this.isCamelCase(filename)) {
                await this.doAction(
                  path.join(file, '../', `${camelCase(filename)}.vue`),
                  file
                );
              }
            } else if (!this.isPascalCase(filename)) {
              await this.doAction(
                path.join(file, '../', `${pascalCase(filename)}.vue`),
                file
              );
            }
          } else {
            if (!this.isKebabCase(filename)) {
              await this.doAction(
                path.join(file, '../', `${kebabCase(filename)}.${extname}`),
                file
              );
            }
          }
        }
      },
      { concurrency: 5 }
    );
    this.logger.success('完成检测与重命名');
  }
  async doAction(news: string, old: string) {
    console.log(`${chalk.yellow(old)} -> ${chalk.green(news)}`);
    await fs.rename(old, news);
    await execa(`git mv ${old} ${news}`, {
      stdio: 'ignore'
    });
  }
  private isCamelCase(str: string) {
    return str === camelCase(str);
  }
  private isPascalCase(str: string) {
    return str === pascalCase(str);
  }
  private isKebabCase(str: string) {
    return str === kebabCase(str);
  }
  private isVuePage(file: string) {
    return (
      !file.startsWith('src/components') &&
      !this.getInDirectory(file, 'components')
    );
  }
  private isConfigJS(filename: string) {
    return filename.endsWith('config.js');
  }
  private getInDirectory(file: string, dirname: string) {
    return file.includes(`/${dirname}/`);
  }
}

export default () => {
  new Rename().run();
};
