import BaseCommand from '../../util/BaseCommand.js';
import kill from '../kill.js';
import { VueServerInfo } from './index.js';
import { getMatch } from './utils.js';

class Stop extends BaseCommand {
  async run() {
    const db = this.helper.createDB('vueServer');
    await db.read();
    const raw = (db.data as any).items as VueServerInfo[];
    const match = await getMatch({
      source: raw,
      tip: '选择要关闭的项目'
    });
    match.servePort && (await kill(['port', match.servePort as string]));
    match.buildPort && (await kill(['port', match.buildPort as string]));
    match.servePort = '';
    match.buildPort = '';
    await db.write();
  }
}
export default () => {
  new Stop().run();
};
