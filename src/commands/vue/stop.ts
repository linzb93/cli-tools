import BaseCommand from '../../util/BaseCommand.js';
import kill from '../kill.js';
import { VueServerInfo } from './index.js';
import { getMatch } from './utils.js';

class Stop extends BaseCommand {
  async run() {
    const db = this.helper.createDB('vueServer');
    await db.read();
    const raw = (db.data as any).items as VueServerInfo[];
    const items = raw.filter((item) => item.servePort);
    const match = await getMatch(items, '选择要关闭的项目');
    match.servePort = '';
    await db.write();
    await kill(['port', match.servePort as string]);
  }
}
export default () => {
  new Stop().run();
};
