import BaseCommand from '../util/BaseCommand.js';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
class Bug extends BaseCommand {
  private source: string;
  constructor(source: string) {
    super();
    this.source = source;
  }
  async run() {
    const seg = this.source.split(':');
    const filePath = seg.slice(0, 2).join(':');
    const filename = path.basename(filePath);
    const target = path.resolve(this.helper.root, `.temp/${filename}`);
    const lineText = seg.slice(2).join(':');
    const isEditorPath = `${target}:${lineText}`;
    const ws = fs.createWriteStream(target);
    axios({
      url: filePath,
      responseType: 'stream'
    }).then((res) => {
      res.data.pipe(ws);
    });
    await new Promise((resolve) => {
      ws.on('finish', () => {
        resolve(null);
      });
    });
    this.helper.openInEditor(isEditorPath, true);
  }
}

export default (source: string) => {
  new Bug(source).run();
};
