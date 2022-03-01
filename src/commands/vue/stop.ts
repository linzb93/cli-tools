import BaseCommand from '../../util/BaseCommand.js';
import kill from '../kill.js';
import { VueServerInfo } from './index.js';
import { getMatches } from './utils.js';

class Stop extends BaseCommand {
  async run() {
    const db = this.helper.createDB('vueServer');
    await db.read();
    const raw = (db.data as any).items as VueServerInfo[];
    const items = raw.filter((item) => item.servePort);
    const match = await getMatches({
      source: items,
      tip: '选择要关闭的项目',
      isServe: true
    });
    match.servePort = '';
    match.buildPort = '';
    await db.write();
    await kill(['port', match.servePort as string]);
  }
}
export default () => {
  new Stop().run();
};
