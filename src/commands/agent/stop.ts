import inquirer from 'inquirer';
import { db } from './util/index.js';
import Kill from '../kill.js';
import BaseCommand from '../../util/BaseCommand.js';
import { CacheItem } from './index';
export default class extends BaseCommand {
  async run() {
    const cacheData = db.get('items').value() as CacheItem[];
    const matches = cacheData.filter((item) => item.port);
    if (matches.length === 1) {
      await new Kill(['port', matches[0].port as unknown as string]).run();
      delete matches[0].port;
      db.set('items', cacheData).write();
    } else if (matches.length > 1) {
      const { ports } = await inquirer.prompt([
        {
          type: 'checkbox',
          message: '请选择要关闭的进程',
          name: 'ports',
          choices: matches.map((item) => ({
            name: `${item.name || ''}(port:${item.port})`,
            value: item.port
          }))
        }
      ]);
      for (const port of ports) {
        await new Kill(['port', port]).run();
        cacheData.forEach((item) => {
          if (item.port === port) {
            delete item.port;
          }
        });
      }
      db.set('items', cacheData).write();
    } else {
      this.logger.info('没有要关闭的进程');
      return;
    }
  }
}
