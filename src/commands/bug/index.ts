import path from "node:path";
import fs from "fs-extra";
import BaseCommand from "@/util/BaseCommand.js";

interface Options {
  debug: boolean;
  all: boolean;
  help: boolean;
}

class Bug extends BaseCommand {
  constructor(private source: string, private options: Options) {
    super();
  }
  async run() {
    if (this.options.help) {
      this.generateHelp();
      return;
    }
    const seg = this.source.split(":");
    const filePath = seg.slice(0, 2).join(":");
    const filename = path.basename(filePath);
    const target = path.resolve(this.helper.root, `temp/${filename}`);
    const lineText = seg.slice(2).join(":");
    const isEditorPath = `${target}:${lineText}`;
    if (!fs.existsSync(target)) {
      this.spinner.text = "正在下载";
      await this.helper.download(filePath, target);
      this.spinner.succeed("打开文件");
    }
    this.helper.openInEditor(isEditorPath, {
      isGoto: true,
    });
  }
  private generateHelp() {
    this.helper.generateHelpDoc({
      title: 'bug',
      content: `下载bug所在文档并在VSCode中定位到具体位置。
使用方法：
bug [bugfile]`
    })
  }
}

export default (source: string, options: Options) => {
  new Bug(source, options).run();
};
