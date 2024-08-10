import { fork } from "node:child_process";
import BaseCommand from "@/util/BaseCommand.js";
import chalk from "chalk";
import internalIp from "internal-ip";
import path from "node:path";

interface IOptions {
  help: boolean;
}
/**
 * 在子进程中启动服务，退出父进程。
 * 只能用在HTTP服务中，TCP和IPC在父进程退出后也会自动结束
 */
class Fork extends BaseCommand {
  constructor(private filename: string, private options: IOptions) {
    super();
  }
  async run() {
    const { options } = this;
    if (options.help) {
      this.generateHelp();
      return;
    }
    const child = fork(path.resolve(process.cwd(), this.filename), {
      cwd: this.helper.root,
      detached: true,
      stdio: [null, null, null, "ipc"],
    });
    child.on("message", async ({ port }: { port: string }) => {
      const ip = await internalIp.v4();
      console.log(`服务器已启动。${chalk.magenta(`http://${ip}:${port}`)}`);
      child.unref();
      child.disconnect();
      process.exit(0);
    });
  }
  generateHelp() {
    this.helper.generateHelpDoc({
      title: "fork",
      content: `fork一个子进程，解除父子进程的关联，独立子进程。一般用于本机HTTP服务。
使用方法：
fork app.js`,
    });
  }
}

export default (filename: string, options: IOptions) => {
  new Fork(filename, options).run();
};
