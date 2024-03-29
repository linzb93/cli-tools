import del from 'del';
import globby from 'globby';
import pMap from 'p-map';
import BaseCommand from '../util/BaseCommand.js';

// 主要是来清理Windows上被Git同步过来的 macOS 的 .DS_Store
class Clear extends BaseCommand {
  private filename: string;
  constructor(filename: string) {
    super();
    this.filename = filename;
  }
  async run() {
    const { filename } = this;
    const paths = await globby([filename, `**/*/${filename}`, '!node_modules']);
    const len = paths.length;
    if (len === 0) {
      this.logger.info('未发现需要删除的文件');
      return;
    }
    await pMap(paths, async (file) => del(file), { concurrency: 10 });
    this.logger.success(`操作成功，共删除${len}个文件`);
  }
}

export default (filename: string) => {
  new Clear(filename).run();
};
