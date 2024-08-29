import fs from "fs-extra";
import { join, basename } from "node:path";
import open from "open";
import globalNpm from "global-modules";
import BaseCommand from "../../shared/BaseCommand";
import * as helper from '../../shared/helper';
import ls from '../../shared/ls';
import {pLocate} from '../../shared/promiseFn'
import vscode from "../../shared/vscode";
interface Options {
  name: string;
  reuse: boolean;
  help?: boolean;
}
interface OpenItem {
  name: string;
  setting?: string;
  isEditor: boolean;
  target?: string;
}

class Open extends BaseCommand {
  constructor(private name: string, private options: Options) {
    super();
  }
  async run() {
    const { name, options } = this;
    if (options.help) {
      this.generateHelp();
      return;
    }
    if (name === "source") {
      this.openSource();
      return;
    }
    if (name === "cmd") {
      await open(
        helper.isWin
          ? "https://www.yuque.com/linzb93/fedocs/rrfmzp"
          : "https://www.yuque.com/linzb93/fedocs/tu3wft"
      );
      return;
    }
    const map = [
      {
        name: "test",
        setting: "code.tools",
        isEditor: true,
      },
      {
        name: "cli",
        setting: "code.cli",
        isEditor: true,
      },
      {
        name: "global",
        target: globalNpm,
        isEditor: true,
      },
    ];
    await this.makeOpenAction(map, name);
  }
  private async openSource() {
    const { options } = this;
    const sourceDir = ls.get("open.source");
    const dirs = await fs.readdir(sourceDir);
    if (options.name) {
      let matchPath: string;
      try {
        matchPath = await pLocate(
          [
            join(sourceDir, options.name),
            join(sourceDir, `${options.name}.lnk`),
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
        this.logger.error("项目不存在");
        return;
      }
      const path2 = await helper.getOriginPath(matchPath);
      await vscode.open(path2, {
        reuse: options.reuse,
      });
    } else {
      const { source } = await this.inquirer.prompt([
        {
          type: "list",
          name: "source",
          message: "选择要打开的项目",
          choices: dirs.map((dir) => basename(dir)),
        },
      ]);
      const path2 = join(sourceDir, source);
      await vscode.open(path2, {
        reuse: options.reuse,
      });
    }
  }
  private async makeOpenAction(map: OpenItem[], name: string) {
    const { options } = this;
    const match = map.find((item) => item.name === name);
    if (!match) {
      return;
    }
    if (match.setting && match.isEditor) {
      await vscode.open(ls.get(match.setting), {
        reuse: options.reuse,
      });
    } else if (match.target) {
      await open(match.target);
    }
  }
  private generateHelp() {
    helper.generateHelpDoc({
      title: "open",
      content: `打开指定的网页或项目
使用方法：
cli - 命令行项目
test - 本机的测试项目
source - 本机的开源项目代码，--name=<source> 打开具体的项目
cmd - 本机系统的命令行文件`,
    });
  }
}

export default (name: string, options: Options) => {
  new Open(name, options).run();
};
