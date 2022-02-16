import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import pMap from 'p-map';
import BaseCommand from '../../util/BaseCommand.js';
import { ref } from '@vue/reactivity';
import { watch } from '@vue/runtime-core';

// 扫描所有工作项目文件夹，有未提交、推送的git就提醒。
export default class extends BaseCommand {
  async run() {
    const openMap = this.db.get('open');
    const outputList: { title: string; children: string[] }[] = [];
    this.spinner.text = '开始扫描';
    const counter = ref(0);
    watch(counter, (value) => {
      this.spinner.text = `已扫描${value}个项目`;
    });
    await pMap(
      ['admin', 'tools', 'mt', 'ele', 'print'],
      async (parentProj) => {
        const cur: {
          title: string;
          children: string[];
        } = {
          title: path.basename(openMap[parentProj]),
          children: []
        };
        const dirs = await fs.readdir(openMap[parentProj]);
        await pMap(
          dirs,
          async (dir) => {
            const status = await this.git.getPushStatus({
              cwd: path.join(openMap[parentProj], dir)
            });
            let str = '';
            if (status === 1) {
              str = `项目${dir} ${chalk.red('未提交')}`;
            } else if (status === 2) {
              str = `项目${dir} ${chalk.yellow('未推送')}`;
            } else if (status === 4) {
              str = `项目${dir} ${chalk.yellow('不在master分支上')}`;
            }
            if (str) {
              cur.children.push(str);
            }
            counter.value++;
          },
          { concurrency: 1 }
        );
        outputList.push(cur);
      },
      { concurrency: 1 }
    );
    this.spinner.succeed('扫描完成');
    for (const item of outputList) {
      if (!item.children.length) {
        continue;
      }
      console.log(`├─${item.title}`);
      for (const child of item.children) {
        console.log(`|  ├─${child}`);
      }
      console.log('|');
    }
  }
}
