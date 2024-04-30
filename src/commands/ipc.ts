import BaseCommand from '../util/BaseCommand.js';
import ipc from 'node-ipc';
import { execaCommand as execa } from 'execa';
class Ipc extends BaseCommand {
  async run() {
    // 目前在Windows系统提供给Electron app启动vue项目
    ipc.config.id = 'node14';
    ipc.config.retry = 1500;
    ipc.serve(() => {
      ipc.server.on('message', async (data, socket) => {
        if ((data.action = 'vue-build')) {
          await execa('npm run build', {
            cwd: data.params.cwd
          });
          ipc.server.emit(socket, 'response', {
            code: 200
          });
        }
      });
    });
    ipc.server.start();
  }
}

export default () => {
  new Ipc().run();
};
