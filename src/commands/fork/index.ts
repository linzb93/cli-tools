import { fork } from 'child_process';
import BaseCommand from '@/util/BaseCommand.js';
import chalk from 'chalk';
import internalIp from 'internal-ip';
import path from 'node:path';

// 在子进程中启动服务，退出父进程
class Fork extends BaseCommand {
  constructor(private filename: string) {
    super();
    this.filename = filename;
  }
  async run() {
    const child = fork(path.resolve(process.cwd(), this.filename), {
      cwd: this.helper.root,
      detached: true,
      stdio: [null, null, null, 'ipc']
    });
    child.on('message', async ({ port }: { port: string }) => {
      const ip = await internalIp.v4();
      console.log(`服务器已启动。${chalk.magenta(`http://${ip}:${port}`)}`);
      child.unref();
      child.disconnect();
      process.exit(0);
    });
  }
}

export default (filename: string) => {
  new Fork(filename).run();
};
