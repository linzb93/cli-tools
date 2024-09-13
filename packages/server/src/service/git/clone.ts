import path from "node:path";
import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import npm, { Npm } from "@/common/npm";
import BaseCommand from "@/common/BaseCommand";
import { pRetry } from "@/common/promiseFn";
import sql from "@/common/sql";
import * as helper from "@/common/helper";
import vscode from "@/common/vscode";
import * as git from "./shared";
export interface Options {
  dir: string;
  open?: boolean;
  from?: string;
  install?: boolean;
  help: boolean;
}
/**
 * git clone功能，支持从下面这些地方clone:
 * 1. git地址
 * 2. github，输入关键词，clone第一个仓库
 * 3. npm模块对应的github官网
 */
export default class extends BaseCommand {
  private source: string;
  private options: Options;
  async main(data: string[], opt: Options) {
    this.source = data[0];
    this.options = opt;
    const { source, options } = this;
    if (options.help) {
      this.generateHelp();
      return;
    }
    helper.validate(
      {
        source,
      },
      {
        source: [
          {
            required: true,
            message:
              "请输入项目来源，可以是npm包、GitHub搜索关键词，或Git项目地址",
          },
        ],
      }
    );
    this.spinner.text = "正在下载";
    let dirName: string = "";
    const openMap = await sql((db) => db.open);
    if (!options.dir) {
      options.dir = "source";
    } else if (!openMap[options.dir]) {
      const answer = await this.inquirer.prompt({
        message: "文件夹不存在，请从以下文件夹中选择一个",
        name: "folder",
        type: "list",
        choices: Object.keys(openMap).map((folder) => {
          return {
            name: openMap[folder],
            value: folder,
          };
        }),
      });
      options.dir = answer.folder;
    }
    const remoteDir = await this.getCloneUrl();
    try {
      dirName = await pRetry(
        () =>
          git.clone({
            url: remoteDir,
            dirName: path.basename(remoteDir, ".git"),
            cwd: openMap[options.dir],
          }),
        {
          retryTimes: 10,
          retryTimesCallback: (times) => {
            this.spinner.text = `第${times}次下载失败，正在重试`;
          },
        }
      );
    } catch (error) {
      this.spinner.fail(`下载失败:
${(error as Error).message}`);
      return;
    }
    if (options.install) {
      this.spinner.text = "正在安装依赖";
      await npm.install({
        cwd: path.join(openMap[options.dir], path.basename(remoteDir, ".git")),
      });
    }
    this.spinner.succeed("下载成功");
    if (options.open) {
      await vscode.open(path.resolve(openMap[options.dir], dirName));
    }
  }
  private async getCloneUrl(): Promise<string> {
    const { source, options } = this;
    // 普通的git地址，也可以是GitHub项目地址
    if (this.isGitUrl(source)) {
      return this.toGitUrl(source);
    }
    // 从github搜索
    if (options.from === "github" || options.from === "gh") {
      let pageRes: AxiosResponse;
      try {
        pageRes = await pRetry(
          () =>
            axios({
              url: `https://github.com/search?q=${source}`,
              timeout: 15000,
            }),
          {
            retryTimes: 5,
            retryTimesCallback: (times) => {
              this.spinner.text = `第${times}次搜索失败，正在重试`;
            },
          }
        );
      } catch {
        this.spinner.fail("下载失败:访问已超时", true);
        return;
      }
      const $ = cheerio.load(pageRes.data);
      const $target = $(".repo-list").first().children().first();
      return `https://github.com${$target.find("a").first().attr("href")}.git`;
    }
    // 从npm搜索
    let page: Npm;
    try {
      page = await npm.getPage(source);
    } catch (error) {
      this.spinner.fail(`获取失败：${(error as Error).message}`, true);
      return;
    }
    const repo = page.get("repository");
    return `${repo}.git`;
  }
  private isGitUrl(url: string): boolean {
    return helper.isURL(url) || this.isGitSSH(url);
  }
  private isGitSSH(url: string): boolean {
    return url.startsWith("git@") && url.endsWith(".git");
  }
  private toGitUrl(url: string): string {
    if (helper.isURL(url)) {
      return url.endsWith(".git") ? url : `${url}.git`;
    }
    return url
      .replace(/git@([a-z\.]+\.com)\:/, "https://$1/")
      .replace(/[^\.git]$/, ".git");
  }
  private generateHelp() {
    helper.generateHelpDoc({
      title: "git clone",
      content: `支持从github、git地址或者npm网站clone项目。
使用方法：
git clone <url>
参数：
- <url>: git地址、github搜索关键词、npm网站搜索关键词
选项：
- dir: clone的地址
- from=github: 从github clone
- open: clone结束后使用vscode打开
- install: 安装npm依赖`,
    });
  }
}
