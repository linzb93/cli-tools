import BaseCommand from '../../util/BaseCommand.js';
import { v4 as uuidv4 } from 'uuid';

class SetProject extends BaseCommand {
  private url: string;
  private name: string;
  constructor(datas: any[]) {
    super();
    if (datas.length === 1) {
      this.name = datas[0];
      this.url = process.cwd().replace(/\\/g, '/');
    } else {
      this.url = datas[0].replace(/\\/g, '/');
      this.name = datas[1];
    }
  }
  async run() {
    const { url, name } = this;
    const db = this.helper.createDB('vueServer');
    await db.read();
    (db.data as any).items.push({
      cwd: url,
      name,
      id: uuidv4(),
      servePort: '',
      buildPort: ''
    });
    await db.write();
    this.logger.success('添加成功');
  }
}

export default (datas: any[]) => {
  new SetProject(datas).run();
};
