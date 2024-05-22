import { fork } from 'child_process';
import { startService } from '../../util/service/index.js';
import BaseCommand from '../../util/BaseCommand.js';
interface Options {
  dev: boolean;
}
class Server extends BaseCommand {
  private options: Options;
  constructor(options: Options) {
    super();
    this.options = options;
  }
  async run() {
    await startService('schedule');
    fork('http.js', {
      cwd: `${this.helper.root}/dist/commands/server`
    });
  }
}

export default (options: Options) => {
  new Server(options).run();
};
