import fs from 'fs-extra';
import path from 'path';
import open from 'open';
import globalNpm from 'global-modules';
import BaseCommand from '../util/BaseCommand.js';

interface Options {
  name: string;
}
interface OpenItem {
  name: string;
  setting?: string;
  isEditor: boolean;
  target?: string;
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
    const sourceDir = this.ls.get('open.source');
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
  private async makeOpenAction(map: OpenItem[], name: string) {
    const match = map.find((item) => item.name === name);
    if (!match) {
      this.logger.error('命令错误');
      return;
    }
    if (match.setting && match.isEditor) {
      await this.helper.openInEditor(this.ls.get(match.setting));
    } else if (match.target) {
      await open(match.target);
    }
  }
}

export default (name: string, options: Options) => {
  new Open(name, options).run();
};
