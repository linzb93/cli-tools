#!/usr/bin/env node

import { Command } from "commander";
import ip from "@/commands/ip";
import open from "@/commands/open";
import translate from "@/commands/translate";
import occ from "@/commands/occ";
import fs from "fs-extra";
import path from "node:path";
import dayjs from "dayjs";
import { root } from "@/util/helper";
import agent from "@/commands/agent";
import cg from "@/commands/cg";
import bug from "@/commands/bug";
import clear from "@/commands/clear";
import color from "@/commands/color";
import fork from "@/commands/fork";
import kill from "@/commands/kill";
import lixi from "@/commands/lixi";
import mock from "@/commands/mock";
import monitor from "@/commands/monitor";
import spider from "@/commands/spider";
import shortcut from "@/commands/shortcut";
import getSize from "@/commands/size";
import token from "@/commands/token";
import tree from "@/commands/tree";
import git from "@/commands/git";
import npm from "@/commands/npm";
import code from "@/commands/code";

const program = new Command();
program.version("2.0.0");

program.hook("preAction", (thisCommand) => {
  fs.appendFile(
    path.resolve(root, "data/track.txt"),
    `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] ${thisCommand.args.join(" ")}\n`
  );
});

program.command("ip").action(() => {
  ip();
});

program
  .command("open <name>")
  .option("--name <name>", "打开的文件夹")
  .option("-r, --reuse", "强制在已开启的编辑器里打开")
  .action((url, cmd) => {
    open(url, cmd);
  });

program
  .command("eng <text>")
  .option("-e,--example", "显示范例")
  .action((text, options) => {
    translate(text, options);
  });

program
  .command("occ [data...]")
  .option("--token [token]", "获取token或根据token跳转")
  .option("--pc", "打开PC端")
  .option("--copy", "复制地址")
  .option("--test", "测试环境")
  .option("--user", "根据token获取用户信息")
  .option("--version <v>", "版本")
  .option("--debug", "调试模式")
  .action((data, options) => {
    occ(data, options);
  });

program
  .command("agent [sub-command]")
  .option("--proxy <url>", "代理地址")
  .option("--port <num>", "端口号")
  .option("-c, --copy", "复制网络地址")
  .action((subCommand, options) => {
    agent(subCommand, options);
  });
program
  .command("size <url>")
  .option("--rect", "获取宽高")
  .action((filename, options) => {
    getSize(filename, options);
  });
program
  .command("mon [filename]")
  .allowUnknownOption()
  .action((file, _, options) => {
    const combinedOptions = options.args.slice(1);
    monitor(file, combinedOptions);
  });
program
  .command("spider <url>")
  .option("--dest <dest>", "下载目标文件夹")
  .action((url, option) => {
    spider(url, option);
  });
program.command("lixi").action(() => {
  lixi();
});
program
  .command("tree [dir]")
  .option("--level <level>", "层级")
  .option("--ignore <dirs>", "添加忽略的文件夹")
  .option("-c, --copy", "复制")
  .action((dir, option) => {
    tree(dir, option);
  });
program
  .command("bug [source]")
  .option("--debug", "调试模式")
  .option("-h, --help", "帮助文档")
  .action((source, option) => {
    bug(source, option);
  });
program.command("kill <data...>").action((data) => {
  kill(data);
});
program.command("clear <filename>").action((filename) => {
  clear(filename);
});
program
  .command("cg [action] [...rest]")
  .option("--realtime", "实时更新")
  .option("-f, --full", "全部")
  .option("--debug", "调试")
  .action((action, rest, options) => {
    cg(action, rest, options);
  });
program
  .command("token <data>")
  .option("-o --origin", "原始数据")
  .option("-c --complete", "完整数据")
  .action((data, options) => {
    token(data, options);
  });
program
  .command("color <text>")
  .option("--get")
  .action((data, options) => {
    color(data, options);
  });
program.command("fork <filename>").action((file) => {
  fork(file);
});
program
  .command("mock [action]")
  .option("--force", "强制更新所有接口并启动服务器")
  .option("--single [path]", "更新单一接口")
  .option("--update", "只更新接口")
  .action((action, options) => {
    mock(action, options);
  });
program.command("shortcut [name]").action((name) => {
  shortcut(name);
});

program
  .command("git <sub-command> [rest...]")
  .option("--dir <dir>", "选择安装的目录")
  .option("--open", "在VSCode中打开项目")
  .option("--from <src>", "来源")
  .option("-d, --delete", "删除")
  .option("-g, --get", "获取")
  .option("-c, --current", "当前的")
  .option("--commit <msg>", "提交信息")
  .option("--latest", "获取最新版的")
  .option("--type <type>", "类型")
  .option("--tag <name>", "tag名称")
  .option("-i,--install", "安装")
  .option("--last <len>", "最近几次")
  .option("--debug", "调试模式")
  .action((subCommand, rest, cmd) => {
    git(subCommand, rest, cmd);
  });
program
  .command("npm [sub-command] [rest...]")
  .option("-D, --dev", "安装到devDependencies")
  .option("-g, --global", "全局操作")
  .option("--open", "打开页面")
  .option("--help", "帮助文档")
  .action((subCommand: string, rest, cmd) => {
    npm(subCommand, rest, cmd);
  });
  program
  .command("code [sub-command] [rest...]")
  .option("--help", "帮助文档")
  .action((subCommand: string, rest) => {
    code(subCommand, rest);
  });
program.parse(process.argv);
