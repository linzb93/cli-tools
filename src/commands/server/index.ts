import BaseCommand from '../../util/BaseCommand.js';
import { fork } from 'child_process';
import chalk from 'chalk';
import path from 'path';
class Server extends BaseCommand {
  run() {
    const child = fork(
      path.resolve(this.helper.root, './dist/commands/server/server.js'),
      [],
      {
        cwd: this.helper.root,
        detached: true,
        stdio: [null, null, null, 'ipc']
      }
    );
    child.on(
      'message',
      async ({
        ip,
        port,
        services
      }: {
        ip: string;
        port: number;
        services: any[];
      }) => {
        this.logger.success(`
服务器已启动，地址是：${chalk.yellow(`http://${ip}:${port}`)},
以下服务已开启：
${services.map((service, index) => chalk.cyan(`${index + 1}.${service}`))}
        `);
        child.unref();
        child.disconnect();
        process.exit(0);
      }
    );
  }
}

export default () => {
  new Server().run();
};
