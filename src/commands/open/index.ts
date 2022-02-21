import fs from 'fs-extra';
import path from 'path';
import open from 'open';
// import { fork } from 'child_process';
import { execaCommand as execa } from 'execa';
import globalNpm from 'global-modules';
import BaseCommand from '../../util/BaseCommand.js';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync.js';
import { root } from '../../util/helper.js';
const adapter = new FileSync(path.resolve(root, 'data/openServer.json'));
const db = low(adapter);

interface Options {
  name: string;
}
interface OpenItem {
  name: string;
  setting?: string;
  isEditor: boolean;
  target?: string;
}

interface VueServerInfo {
  cwd: string;
  name: string;
  port: string;
}

class Open extends BaseCommand {
  private name: string;
  private options: Options;
  constructor(name: string, options: Options) {
    super();
    this.name = name;
    this.options = options;
  }
  async run() {
    const { name } = this;
    if (name === 'source') {
      this.openSource();
      return;
    }
    if (name === 'server') {
      this.openServer();
      return;
    }
    const map = [
      {
        name: 'test',
        setting: 'code.tools',
        isEditor: true
      },
      {
        name: 'cli',
        setting: 'code.cli',
        isEditor: true
      },
      {
        name: 'global',
        target: globalNpm,
        isEditor: true
      }
    ];
    await this.makeOpenAction(map, name);
  }
  private async openSource() {
    const { options } = this;
    const sourceDir = this.db.get('open.source');
    const dirs = await fs.readdir(sourceDir);
    if (options.name) {
      let matchPath: string;
      try {
        matchPath = await this.helper.pLocate(
          [
            path.join(sourceDir, options.name),
            path.join(sourceDir, `${options.name}.lnk`)
          ],
          async (file: string) => {
            try {
              await fs.access(file);
            } catch (error) {
              throw error;
            }
            return file;
          }
        );
      } catch (error) {
        this.logger.error('项目不存在');
        return;
      }
      const path2 = await this.helper.getOriginPath(matchPath);
      await this.helper.openInEditor(path2);
    } else {
      const { source } = await this.helper.inquirer.prompt([
        {
          type: 'list',
          name: 'source',
          message: '选择要打开的源码',
          choices: dirs.map((dir) => path.basename(dir))
        }
      ]);
      const path2 = await this.helper.getOriginPath(
        path.join(sourceDir, source)
      );
      // console.log(path2);
      await this.helper.openInEditor(path2);
    }
  }
  private async openServer() {
    const items = db.get('items').value() as VueServerInfo[];
    const child = execa('npx vue-cli-service serve --open', {
      cwd: items[0].cwd,
      stdio: 'pipe'
    });
    child.stdout?.pipe(fs.createWriteStream('vue.txt'));
    console.log('服务已启动');
    await this.helper.sleep(1000);
    process.nextTick(() => {
      child.unref();
      //   child.disconnect();
      process.exit(1);
    });
  }
  private async makeOpenAction(map: OpenItem[], name: string) {
    const match = map.find((item) => item.name === name);
    if (!match) {
      this.logger.error('命令错误');
      return;
    }
    if (match.setting && match.isEditor) {
      await this.helper.openInEditor(this.db.get(match.setting));
    } else if (match.target) {
      await open(match.target);
    }
  }
}

export default (name: string, options: Options) => {
  new Open(name, options).run();
};
