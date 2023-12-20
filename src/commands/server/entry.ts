import BaseCommand from '../../util/BaseCommand.js';
import path from 'path';
import monitor from '../monitor.js';
import { fork } from 'child_process';
interface Options {
  dev: boolean;
}

class Server extends BaseCommand {
  private options: Options;
  constructor(options: Options) {
    super();
    this.options = options;
  }
  run() {
    const target = path.resolve(this.helper.root, './dist/commands/server');
    if (this.options.dev) {
      monitor(target, []);
    } else {
      fork(target);
    }
  }
}

export default (options: Options) => {
  new Server(options).run();
};
