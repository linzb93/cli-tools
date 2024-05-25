import path from "node:path";
import fs from "fs-extra";
import axios, { AxiosResponse } from "axios";
import chalk from "chalk";
import * as cheerio from "cheerio";
import { Npm } from "@/util/npm";
import BaseCommand from "@/util/BaseCommand";
import { SecretDB } from "@/util/types";

interface Options {
  dir: string;
  open?: boolean;
  from?: string;
  install?: boolean;
}
class Clone extends BaseCommand {
  private source: string;
  private options: Options;
  constructor(source: string[], options: Options) {
    super();
    this.source = source[0];
    this.options = options;
  }
  async run() {
    const { source, options } = this;
    this.helper.validate(
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
    let dirName: string;
    const openMap = this.ls.get("open") as SecretDB["open"];
    if (!options.dir) {
      options.dir = "source";
    } else if (!openMap[options.dir]) {
      const answer = await this.helper.inquirer.prompt({
        message: "文件夹可能输入有误，请从以下文件夹中选择一个",
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
    if (this.isGitUrl(source)) {
      const url = this.toGitUrl(source);
      try {
        dirName = await this.helper.pRetry(
          () =>
            this.git.clone({
              url,
              dirName: path.basename(url, ".git"),
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
        await this.npm.install({
          cwd: path.join(openMap[options.dir], path.basename(url, ".git")),
        });
      }
      this.spinner.succeed("下载成功");
      if (options.open) {
        await this.helper.openInEditor(
          path.resolve(openMap[options.dir], dirName)
        );
      }
      return;
    }
    if (options.from === "github" || options.from === "gh") {
      let pageRes: AxiosResponse;
      try {
        pageRes = await this.helper.pRetry(
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
        this.spinner.fail("下载失败:访问已超时");
        return;
      }
      const $ = cheerio.load(pageRes.data);
      const $target = $(".repo-list").first().children().first();
      const url = `https://github.com${$target
        .find("a")
        .first()
        .attr("href")}.git`;
      this.spinner.text = `正在从${chalk.cyan(url)}下载`;
      try {
        dirName = await this.helper.pRetry(
          () =>
            this.git.clone({
              url,
              dirName: path.basename(url, ".git"),
              cwd: openMap[options.dir],
            }),
          {
            retryTimes: 2,
            retryTimesCallback: (times) => {
              this.spinner.text = `第${times}次拉取失败，正在重新尝试拉取`;
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
        await this.npm.install({
          cwd: path.join(openMap[options.dir], path.basename(url, ".git")),
        });
      }
      this.spinner.succeed("下载成功");
      if (options.open) {
        await this.helper.openInEditor(
          path.resolve(openMap[options.dir], dirName)
        );
      }
      return;
    }
    let page: Npm;
    try {
      page = await this.npm.getPage(source);
    } catch (error) {
      this.logger.error((error as Error).message);
      return;
    }
    const repo = page.get("repository");
    const cwd = this.ls.get("open.source");
    if (fs.existsSync(path.join(cwd, path.basename(repo)))) {
      this.spinner.text = "正在拉取最新代码";
      try {
        await this.helper.pRetry(
          () =>
            this.git.pull({
              cwd: path.join(cwd, path.basename(repo)),
            }),
          {
            retryTimes: 5,
            retryTimesCallback: (times) => {
              this.spinner.text = `第${times}次拉取失败，正在重新尝试拉取`;
            },
          }
        );
      } catch (error) {
        this.spinner.fail("拉取代码失败");
        return;
      }
      this.spinner.succeed("拉取代码成功");
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
            cwd,
          }),
        {
          retryTimes: 5,
          retryTimesCallback: (times) => {
            this.spinner.text = `第${times}次拉取失败，正在重新尝试拉取`;
          },
        }
      );
    } catch (error) {
      this.spinner.fail(
        "下载失败：" + JSON.stringify((error as Error).message)
      );
      return;
    }
    this.spinner.succeed("下载成功");
    if (options.install) {
      this.spinner.text = "正在安装依赖";
      await this.npm.install({
        cwd: path.join(openMap[options.dir], path.basename(repo, ".git")),
      });
    }
    if (options.open) {
      await this.helper.openInEditor(path.resolve(cwd, dirName));
    }
  }
  private isGitUrl(url: string): boolean {
    return this.helper.isURL(url) || this.isGitSSH(url);
  }
  private isGitSSH(url: string): boolean {
    return url.startsWith("git@") && url.endsWith(".git");
  }
  private toGitUrl(url: string): string {
    if (this.helper.isURL(url)) {
      return url.endsWith(".git") ? url : `${url}.git`;
    }
    return url
      .replace(/git@([a-z\.]+\.com)\:/, "https://$1/")
      .replace(/[^\.git]$/, ".git");
  }
}

export default (source: string[], options: Options) => {
  new Clone(source, options).run();
};
