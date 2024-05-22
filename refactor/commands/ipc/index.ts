import BaseCommand from '../../util/BaseCommand.js';
import ipc from 'node-ipc';
import { execaCommand as execa } from 'execa';

const isMac = process.platform === 'darwin';

class Ipc extends BaseCommand {
  async run() {
    // 目前在Windows系统提供给Electron app启动vue项目
    ipc.config.id = 'node14';
    ipc.config.retry = 1500;
    ipc.serve(() => {
      ipc.server.on('message', async (data, socket) => {
        const { requestId } = data;
        if (data.action === 'vue-build') {
          await execa('npx vue-cli-service build', {
            cwd: data.params.cwd
          });
          ipc.server.emit(socket, 'response', {
            code: 200,
            requestId
          });
        } else if (data.action === 'vue-serve') {
          const std = execa('npx vue-cli-service serve', {
            cwd: data.params.cwd
          });
          const IpPortReg = /(\d{1,3}\.){3}\d{1,3}:\d{4}/;
          if (isMac) {
            std.stdout?.on('data', (message) => {
              if (message.toString().includes('- Network')) {
                const arr = message.toString().match(IpPortReg);
                ipc.server.emit(socket, 'response', {
                  code: 200,
                  address: arr ? arr[0] : '',
                  requestId
                });
              }
            });
          } else {
            // 最好的办法是3秒以内没有收到信息才emit
            std.stderr?.on('data', async (message) => {
              const arr = message.toString().match(IpPortReg);
              if (arr) {
                await this.helper.sleep(3000);
                ipc.server.emit(socket, 'response', {
                  code: 200,
                  address: arr[0],
                  requestId
                });
              }
            });
          }
        }
      });
    });
    ipc.server.start();
  }
}

export default () => {
  new Ipc().run();
};
