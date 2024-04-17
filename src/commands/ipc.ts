import BaseCommand from '../util/BaseCommand.js';

class Ipc extends BaseCommand {
  async run() {
    // 目前在Windows系统提供给Electron app启动vue项目
  }
}

export default () => {
  new Ipc().run();
};
