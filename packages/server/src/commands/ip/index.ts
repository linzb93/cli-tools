import publicIp from "public-ip";
import internalIp from "internal-ip";
import chalk from "chalk";
import axios from "axios";
import { load } from "cheerio";
import Table from "cli-table3";
import BaseCommand from "@/util/BaseCommand";

interface Options {
  help?: boolean;
}

class Ip extends BaseCommand {
  constructor(private data?: string[], private options?: Options) {
    super();
  }
  async run() {
    if (this.options.help) {
      this.generateHelp();
      return;
    }
    if (this.data[0] === "get") {
      this.getIpLocation();
      return;
    }
    this.spinner.text = "正在获取IP";
    const [iIp, pIp] = await Promise.all([internalIp.v4(), publicIp.v4()]);
    this.spinner.succeed(`内网IP: ${chalk.cyan(iIp)}
  公网IP: ${chalk.cyan(pIp)}`);
    // ipv6就不要了，时间很久，不知道能不能获取。
  }
  /**
   * 获取内网IP。
   * @returns {Promise<string>} 内网IP地址
   */
  async get() {
    const iIp = await internalIp.v4();
    return iIp;
  }
  /**
   * 获取IP归属地
   */
  private async getIpLocation() {
    this.spinner.text = "正在查询IP信息";
    const ip = this.data[1];
    const { data: html } = await axios.get(
      `https://www.ip138.com/iplookup.php?ip=${ip}&action=2`
    );
    const $ = load(html);
    let output = $("tbody")
      .first()
      .children()
      .map(function (_, el) {
        const $childrens = $(el).children();
        const label = $childrens.first().text();
        const data = $childrens.last().text();
        return [label, data];
      })
      .toArray();
    const table = new Table();
    table.push(
      {
        [chalk.green("IP")]: ip,
      },
      {
        [chalk.green(output[0])]: output[1].replace(/\n/g, ""),
      },
      {
        [chalk.green(output[2])]: output[3],
      }
    );
    if (!output[2]) {
      table.pop();
    }
    this.spinner.succeed(`查询成功
${table.toString()}`);
  }
  private generateHelp() {
    this.helper.generateHelpDoc({
      title: "ip",
      content: `查询本机内网/公网IP，或者查询IP归属地
使用方法：
ip - 查询本机内网和公网IP
ip get '127.0.0.1' - 查询IP归属地`,
    });
  }
}

export default (data: string[], options: Options) => {
  new Ip(data, options).run();
};

export function get() {
  return new Ip().get();
}
