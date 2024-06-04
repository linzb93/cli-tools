import rawKillPort from "kill-port";
import iconv from "iconv-lite";
import chalk from "chalk";
import BaseCommand from "@/util/BaseCommand";

const numberRE = /[1-9][0-9]*/;

interface IOption {
  help?: boolean;
}

type Params = [string] | [string, string];
class Kill extends BaseCommand {
  constructor(private args: Params, private options?: IOption) {
    super();
  }
  async run() {
    const { args, options } = this;
    if (options?.help) {
      this.generateHelp();
      return;
    }
    if (args.length === 1) {
      if (!numberRE.test(args[0])) {
        this.logger.error("端口号或者进程ID格式不正确，只能输入数字");
        return;
      }
      const id = Number(args[0]);
      if (id < 1000 && !(await this.confirm())) {
        return;
      }
      try {
        await this.killPort(id.toString());
        this.logger.success(`端口 ${chalk.yellow(id)} 关闭成功`);
        return;
      } catch {
        //
      }
      try {
        process.kill(id);
      } catch (error) {
        this.logger.error(
          `不存在端口号为 ${chalk.yellow(id)} 的或进程ID为 ${chalk.yellow(
            id
          )} 的进程`
        );
        return;
      }
      this.logger.success(`进程 ${chalk.yellow(id)} 关闭成功`);
    } else if (args.length === 2) {
      const [target, idStr] = args;
      let id;
      if (target === "port") {
        if (!numberRE.test(idStr)) {
          this.logger.error("端口号格式不正确，只能输入数字", true);
          return;
        }
        id = Number(idStr);
        try {
          await this.killPort(id.toString());
          this.logger.success(`端口 ${chalk.yellow(id)} 关闭成功`);
          return;
        } catch (error) {
          this.logger.error(`端口 ${chalk.yellow(id)} 不存在`);
        }
      } else if (target === "pid") {
        if (!numberRE.test(idStr)) {
          this.logger.error("进程ID格式不正确，只能输入数字");
          return;
        }
        id = Number(idStr);
        if (id < 1000 && !(await this.confirm())) {
          return;
        }
        try {
          process.kill(id);
          this.logger.success(`进程 ${chalk.yellow(id)} 关闭成功`);
        } catch (error) {
          this.logger.error(`进程ID为 ${chalk.yellow(id)} 的进程不存在`);
          return;
        }
      } else {
        this.logger.error("命令不正确，请输入进程ID: pid，或者端口号: port");
      }
    }
  }
  private async confirm(): Promise<boolean> {
    const ans = await this.helper.inquirer.prompt([
      {
        type: "confirm",
        message: "您可能要关闭系统进程，确认是否继续？",
        name: "data",
        default: false,
      },
    ]);
    return ans.data;
  }
  private async killPort(port: string): Promise<null> {
    return new Promise((resolve, reject) => {
      rawKillPort(port, "tcp")
        .then((data) => {
          if (data.stderr) {
            reject(iconv.decode(Buffer.from(data.stderr), "utf8"));
          } else {
            resolve(null);
          }
        })
        .catch(reject);
    });
  }
  private generateHelp() {
    this.helper.generateHelpDoc({
      title: "kill",
      content: `根据端口号/进程ID结束任务。
使用方法：
- kill port 8080: 根据端口号结束任务
- kill pid 23019: 根据进程ID结束任务
- kill 9080: 根据端口号或者进程ID结束任务`,
    });
  }
}

export default async (args: Params, options?: IOption) => {
  await new Kill(args, options).run();
};
