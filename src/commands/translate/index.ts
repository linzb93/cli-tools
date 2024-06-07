import * as cheerio from "cheerio";
import axios from "axios";
import chalk from "chalk";
import Table from "cli-table3";
import open from "open";
import BaseCommand from "@/util/BaseCommand";

interface Options {
  example: boolean;
  help: boolean;
}

/**
 * 使用有道词典API翻译。
 */
class Translate extends BaseCommand {
  private isC2E: boolean; // 是否是中文翻译成英文
  constructor(private text: string, private options: Options) {
    super();
    this.isC2E = !/[a-z]+/.test(text);
  }
  async run() {
    const { options, text, isC2E } = this;
    if (options.help) {
      this.generateHelp();
      return;
    }
    this.spinner.text = "正在查找";
    try {
      // 使用有道翻译
      const { data } = await axios.get(
        `https://youdao.com/w/eng/${encodeURIComponent(text)}/`
      );
      const $ = cheerio.load(data);
      const meanings = Array.from(
        $(".trans-container")
          .first()
          .children("ul")
          .children()
          .map((_, item) => {
            const typeRet = $(item).text().replace(/\s/g, "");
            if (typeRet.includes(".")) {
              const type = typeRet.split(".")[0];
              return `${chalk.gray(type)} ${typeRet.split(".")[1]}`;
            }
            return typeRet;
          })
      );
      this.spinner.stop();
      if (!meanings.length) {
        // 如果没有搜索结果，就打开页面自行查找
        await open(`https://youdao.com/w/eng/${encodeURIComponent(text)}`);
        return;
      }
      if (options.example) {
        const arrs: { en: string; cn: string }[] = [];
        $("#bilingual")
          .find("li")
          .filter((index) => index < 2)
          .each((_, item) => {
            const $list = $(item).children("p");
            const $en = isC2E ? $list.eq(1) : $list.first();
            const enText = Array.from(
              $en.children("span").map((_, sub) => $(sub).text())
            ).join("");
            const $cn = isC2E ? $list.first() : $list.eq(1);
            const cnText = Array.from(
              $cn.children("span").map((_, sub) => $(sub).text())
            ).join("");
            if (isC2E) {
              arrs.push({
                en: enText,
                cn: cnText.replace(text, chalk.green(text)),
              });
            } else {
              arrs.push({
                en: enText.replace(text, chalk.green(text)),
                cn: cnText,
              });
            }
          });
        const table = new Table({
          head: [chalk.green("含义"), chalk.green("范例")],
          colAligns: ["left", "left"],
        });
        table.push([
          meanings.map((str) => this.lineFeed(str)).join("\n\n"),
          arrs
            .map((item, index) => {
              if (isC2E) {
                return `${index + 1}.${item.cn}\n${item.en}`;
              } else {
                return `${index + 1}.${item.en}\n${item.cn}`;
              }
            })
            .join("\n\n"),
        ]);
        console.log(table.toString());
      } else {
        this.logger.box({
          title: text,
          borderColor: "red",
          content: meanings.join("\n\n"),
          padding: 1,
        });
      }
    } catch (error) {
      this.spinner.fail("服务器故障，请稍后再试");
      console.log(error);
    }
  }
  private lineFeed(str: string, perLineLength = 30): string {
    const strList = str.split(" ");
    let tempArr: string[] = [];
    const lines = [];
    strList.forEach((s) => {
      tempArr.push(s);
      if (
        tempArr.reduce((sum, item) => sum + item + " ", "").length >
        perLineLength
      ) {
        lines.push(tempArr.join(" "));
        tempArr = [];
      }
    });
    if (tempArr.length) {
      lines.push(tempArr.join(" "));
    }
    return lines.join("\n");
  }
  private generateHelp() {
    this.helper.generateHelpDoc({
      title: "翻译",
      content: `使用有道词典API进行翻译，自动判断是中译英还是英译中。
使用方法：
eng hello
选项：
- --example: 提供翻译示例`,
    });
  }
}

export default (text: string, options: Options) => {
  new Translate(text, options).run();
};
