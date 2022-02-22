import BaseCommand from '../../util/BaseCommand.js';
// import clipboard from 'clipboardy';
import { execaCommand as execa } from 'execa';
import { getMatch } from './utils.js';
import { VueServerInfo } from './index.js';
import fs from 'fs-extra';
import path from 'path';

class BuildServe extends BaseCommand {
  async run() {
    const db = this.helper.createDB('vueServer');
    await db.read();
    const items = (db.data as any).items as VueServerInfo[];
    const match = await getMatch(items, '请选择要打包的项目');
    await execa('npx vue-cli-service build', {
      cwd: match.cwd
    });
    await fs.copy(
      `${match.cwd}/dist`,
      path.resolve(this.helper.root, `data/vue/${match.id}`),
      {
        recursive: true
      }
    );
    // TODO:服务器启动的代码还没写
  }
}

export default () => {
  new BuildServe().run();
};
