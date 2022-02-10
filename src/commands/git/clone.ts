import path from 'path';
import fs from 'fs-extra';
import axios, { AxiosResponse } from 'axios';
import chalk from 'chalk';
import cheerio from 'cheerio';
import { Npm } from '../../util/npm.js';
import BaseCommand from '../../util/BaseCommand.js';

interface Options {
  dir: string;
  open?: boolean;
  from?: string;
}
export default class extends BaseCommand {
  private pkg: string;
  private options: Options;
  constructor(pkg: string[], options: Options) {
    super();
    this.pkg = pkg[0];
    this.options = options;
  }
  async run() {
    const { pkg, options } = this;
    this.helper.validate(
      {
        pkg
      },
      {
        pkg: [
          {
            required: true,
            message:
              '请输入项目来源，可以是npm包、GitHub搜索关键词，或Git项目地址'
          }
        ]
      }
    );
    this.spinner.text = '正在下载';
    let dirName: string;
    const openMap = this.db.get('open');
    if (!openMap[options.dir]) {
      options.dir = 'source';
    }
    if (this.isGitUrl(pkg)) {
      const url = this.toGitUrl(pkg);
      try {
        dirName = await this.git.clone({
          url,
          dirName: path.basename(url, '.git'),
          cwd: openMap[options.dir]
        });
      } catch (error) {
        this.spinner.fail(`下载失败:
                ${(error as Error).message}`);
        return;
      }
      this.spinner.succeed('下载成功');
      if (options.open) {
        await this.helper.openInEditor(
          path.resolve(openMap[options.dir], dirName)
        );
      }
      return;
    }
    if (options.from === 'github' || options.from === 'gh') {
      let pageRes: AxiosResponse;
      try {
        pageRes = await this.helper.pRetry(
          () =>
            axios({
              url: `https://github.com/search?q=${pkg}`,
              timeout: 15000
            }),
          {
            retries: 5,
            retryTimesCallback: (times) => {
              this.spinner.text = `第${times}次搜索失败，正在重试`;
            }
          }
        );
      } catch {
        this.spinner.fail('下载失败:访问已超时');
        return;
      }
      const $ = cheerio.load(pageRes.data);
      const $target = $('.repo-list').first().children().first();
      const url = `https://github.com${$target
        .find('a')
        .first()
        .attr('href')}.git`;
      this.spinner.text = `正在从${chalk.cyan(url)}下载`;
      try {
        dirName = await this.helper.pRetry(
          () =>
            this.git.clone({
              url,
              dirName: path.basename(url, '.git'),
              cwd: openMap[options.dir]
            }),
          {
            retries: 2,
            retryTimesCallback: (times) => {
              this.spinner.text = `第${times}次拉取失败，正在重新尝试拉取`;
            }
          }
        );
      } catch (error) {
        this.spinner.fail(`下载失败:
                ${(error as Error).message}`);
        return;
      }
      this.spinner.succeed('下载成功');
      if (options.open) {
        await this.helper.openInEditor(
          path.resolve(openMap[options.dir], dirName)
        );
      }
      return;
    }
    let page: Npm;
    try {
      page = await this.npm.getPage(pkg);
    } catch (error) {
      this.logger.error((error as Error).message);
      return;
    }
    const repo = page.get('repository');
    const cwd = this.db.get('open.source');
    if (await fs.pathExists(path.join(cwd, path.basename(repo)))) {
      this.spinner.text = '正在拉取最新代码';
      try {
        await this.helper.pRetry(
          () =>
            this.git.pull({
              cwd: path.join(cwd, path.basename(repo))
            }),
          {
            retries: 5,
            retryTimesCallback: (times) => {
              this.spinner.text = `第${times}次拉取失败，正在重新尝试拉取`;
            }
          }
        );
      } catch (error) {
        this.spinner.fail('拉取代码失败');
        return;
      }
      this.spinner.succeed('拉取代码成功');
      if (options.open) {
        await this.helper.openInEditor(path.resolve(cwd, path.basename(repo)));
      }
      return;
    }
    try {
      dirName = await this.helper.pRetry(
        async () =>
          this.git.clone({
            url: `${repo}.git`,
            shallow: true,
            cwd
          }),
        {
          retries: 5,
          retryTimesCallback: (times) => {
            this.spinner.text = `第${times}次拉取失败，正在重新尝试拉取`;
          }
        }
      );
    } catch (error) {
      this.spinner.fail(
        '下载失败：' + JSON.stringify((error as Error).message)
      );
      return;
    }
    this.spinner.succeed('下载成功');
    if (options.open) {
      await this.helper.openInEditor(path.resolve(cwd, dirName));
    }
  }
  private isGitUrl(url: string): boolean {
    return this.helper.isURL(url) || this.isGitSSH(url);
  }
  private isGitSSH(url: string): boolean {
    return url.startsWith('git@') && url.endsWith('.git');
  }
  private toGitUrl(url: string): string {
    if (this.helper.isURL(url)) {
      return url.endsWith('.git') ? url : `${url}.git`;
    }
    return url
      .replace(/git@([a-z\.]+\.com)\:/, 'https://$1/')
      .replace(/[^\.git]$/, '.git');
  }
}
