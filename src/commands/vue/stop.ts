import BaseCommand from '../../util/BaseCommand.js';
import kill from '../kill.js';
import { VueServerInfo } from './index.js';
import { getMatch } from './utils.js';

class Stop extends BaseCommand {
  private all: boolean;
  constructor(all: boolean) {
    super();
    this.all = all;
  }
  async run() {
    const db = this.helper.createDB('vueServer');
    await db.read();
    const raw = (db.data as any).items as VueServerInfo[];
    if (this.all) {
      raw.forEach((item) => {
        item.servePort = '';
        item.buildPort = '';
      });
    } else {
      const match = await getMatch({
        source: raw,
        tip: '选择要关闭的项目'
      });
      match.servePort && (await kill(['port', match.servePort as string]));
      match.buildPort && (await kill(['port', match.buildPort as string]));
      match.servePort = '';
      match.buildPort = '';
    }
    await db.write();
  }
}
export default (all: boolean) => {
  new Stop(all).run();
};
