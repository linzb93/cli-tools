import path from "node:path";
import { fork } from "node:child_process";
import chalk from "chalk";
import { pick } from "lodash-es";
import BaseCommand from "@/util/BaseCommand";
import { onShutdown } from "@/util/schedule";
import stopAgent from "./stop";
import { ChildProcessEmitData } from "./types";
interface Options {
  proxy: string;
  port: string;
  copy: boolean;
  help?: boolean;
}
export interface CacheItem {
  proxy: string;
  name: string;
  port?: string;
}
interface CacheSaveOption {
  choosed: boolean;
  projName: string;
}

interface DbData {
  items: CacheItem[];
}

/**
 * 开启代理服务器。
 * Vue项目不需要用这个，请在vue.config.js中的devServer.proxy中设置。
 */
class Agent extends BaseCommand {
  constructor(private subCommand: string, private options: Options) {
    super();
  }
  async run() {
    const { subCommand, options } = this;
    if (options.help) {
      this.generateHelp();
      return;
    }
    if (subCommand === "stop") {
      stopAgent();
      return;
    }
    if (subCommand !== undefined) {
      this.logger.error("命令不存在，请重新输入");
      return;
    }
    this.helper.validate(options, {
      proxy: {
        pattern: /^https?\:/,
        message: "格式不合法，请输入网址类型的",
      },
      port: {
        validator: (_, value) => Number(value) > 1000 || value === undefined,
        message: "端口号请输入1000以上的整数",
      },
    });
    // 将过往做过代理的项目存入本地，以后方便使用。
    const db = this.helper.createDB("agent");
    await db.read();
    db.data = db.data || {};
    const cacheData = (db.data as DbData).items;
    const match = cacheData.find((item) => item.proxy === options.proxy);
    if (!match) {
      if (!options.proxy) {
        // 未输入代理的地址，表示是从数据库文件中读取历史记录
        const { server } = await this.helper.inquirer.prompt([
          {
            message: "请选择要开启的代理服务器",
            type: "list",
            choices: cacheData.map((data) => ({
              name: `${data.name} ${chalk.green(`(${data.proxy})`)}`,
              value: data.proxy,
            })),
            name: "server",
          },
        ]);
        options.proxy = server;
      } else {
        // 否则会询问是否将输入内容存入数据库。
        const ans = (await this.helper.inquirer.prompt([
          {
            type: "confirm",
            message: "是否将项目数据存入缓存？",
            name: "choosed",
          },
          {
            type: "input",
            message: "请输入项目名称",
            name: "projName",
            when: (answer) => answer.choosed,
          },
        ])) as CacheSaveOption;
        if (ans.choosed) {
          (db.data as DbData).items.push({
            name: ans.projName,
            proxy: options.proxy,
          });
          await db.write();
        }
      }
    }
    const child = fork(
      path.resolve(this.helper.root, "dist/commands/agent/server.js"),
      [
        ...this.helper.processArgvToFlags(
          pick(options, ["proxy", "port", "copy"])
        ),
      ],
      {
        cwd: this.helper.root,
        detached: true,
        stdio: [null, null, null, "ipc"],
      }
    );
    child.on(
      "message",
      async ({ port, ip, type, errorMessage }: ChildProcessEmitData) => {
        if (type === "close") {
          console.log(`
  代理服务器已在 ${chalk.yellow(port)} 端口启动：
  - 本地：${chalk.magenta(`http://localhost:${port}/proxy`)}
  - 网络：${chalk.magenta(`http://${ip}:${port}/proxy`)}
  路由映射至：${chalk.cyan(options.proxy)}`);
          const items: CacheItem[] = this.ls.get("items").value();
          const match = items.find((item) => item.proxy === options.proxy);
          (match as CacheItem).port = port;
          (db.data as DbData).items = items;
          await db.write();
          onShutdown(async () => {
            await db.read();
            (db.data as DbData).items.forEach((item) => {
              item.port = "";
            });
            await db.write();
          });
          child.unref();
          child.disconnect();
          process.exit(0);
        }
        this.logger.error(errorMessage);
      }
    );
  }
  generateHelp() {
    this.helper.generateHelpDoc({
      title: 'agent',
      content: `生成代理服务器。会将代理信息存入数据库文件中。
使用方法：
${chalk.cyan(`agent --proxy=https://www.example.com --port=5050`)}
选项：
 - proxy：代理的地址。如果没有输入的话，会从数据库文件中读取已存储的代理列表让用户选择。
 - port: 端口号
 
 ${chalk.cyan(`agent stop --port=5050`)} - 关闭代理服务，如果port没有输入的话，会让用户选择。
`
    })
  }
}

export default (subCommand: string, options: Options) => {
  new Agent(subCommand, options).run();
};
