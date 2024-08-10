import del from "del";
import { globby } from "globby";
import pMap from "p-map";
import BaseCommand from "@/util/BaseCommand";

interface IOptions {
  root?: boolean;
  help?: boolean;
}

// 主要是来清理Windows上被Git同步过来的 macOS 的 .DS_Store
class Clear extends BaseCommand {
  constructor(private filename: string, private options?: IOptions) {
    super();
  }
  async run() {
    const { filename, options } = this;
    if (options?.help) {
      this.generateHelp();
      return;
    }
    if (options?.root) {
      await del(filename);
      this.logger.success(`${filename}已删除`);
      return;
    }
    const paths = await getMatchPaths(filename);
    const len = paths.length;
    if (len === 0) {
      this.logger.info("未发现需要删除的文件");
      return;
    }
    await pMap(paths as string[], async (file) => del(file), {
      concurrency: 10,
    });
    this.logger.success(`操作成功，共删除${len}个文件`);
  }
  private generateHelp() {
    this.helper.generateHelpDoc({
      title: 'clear',
      content:`清理文件/文件夹
clear [file/dir]
选项：
- root: 只在根目录下查询`
    })
  }
}

export default (filename: string, options?: IOptions) => {
  return new Clear(filename, options).run();
};

export function getMatchPaths(filename: string) {
  return globby([`**/*/${filename}`, "!node_modules"]);
}
