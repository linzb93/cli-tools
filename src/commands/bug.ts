import BaseCommand from '../util/BaseCommand.js';
import fs from 'fs-extra';
import dayjs from 'dayjs';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import pMap from 'p-map';
class Bug extends BaseCommand {
  private source: string;
  constructor(source: string) {
    super();
    this.source = source;
  }
  async run() {
    if (!this.source) {
      this.getAllBugReport();
      return;
    }
    const seg = this.source.split(':');
    const filePath = seg.slice(0, 2).join(':');
    const filename = path.basename(filePath);
    const target = path.resolve(this.helper.root, `.temp/${filename}`);
    const lineText = seg.slice(2).join(':');
    const isEditorPath = `${target}:${lineText}`;
    if (!fs.existsSync(target)) {
      this.spinner.text = '正在下载';
      await this.helper.download(filePath, target);
      this.spinner.succeed('打开文件');
    }
    this.helper.openInEditor(isEditorPath, true);
  }
  private async getAllBugReport() {
    // 获取上个工作日收集的bug
    const sitemap = [
      {
        name: '美团-经营神器',
        id: 'a61618b1e6e30c3796beb054a92c1ada'
      },
      {
        name: '美团-装修神器',
        id: '313164674c1de78352e6fe3b1b549984'
      },
      {
        name: '饿了么经营神器',
        id: '23589ff77bb181ab09631a267d3d16be'
      },
      {
        name: '美团连锁品牌多店版',
        id: 'a38e77b10c61ce37083d337db3bcb05a'
      },
      {
        name: '美团评价神器',
        id: '625599ce7ed5cd2af5472ea70232dbd9'
      },
      {
        name: '美团-IM神器',
        id: 'f185c8903369e2364258ba815e24cf18'
      },
      {
        name: '美团-点金大师',
        id: '5fc1e9a29c3eecbad5e4cc9c7b0fae76'
      },
      {
        name: '美团-营销神器',
        id: '211fbef553346a71251b3481534caf1f'
      },
      {
        name: '品牌连锁数据分析',
        id: 'e7500e2a12510c1e42ed5eaa17f65ac0'
      }
    ];
    const prefix = this.ls.get('oa.apiPrefix');
    const yesterday = dayjs().subtract(1, 'd');
    const ret: { name: string; totalCount: number }[] = [];
    this.spinner.text = '正在获取报告';
    await pMap(
      sitemap,
      async (site) => {
        await axios
          .post(`${prefix}/dataanaly/data/analysis/jsErrorCount`, {
            beginTime: yesterday.format('YYYY-MM-DD 00:00:00'),
            endTime: yesterday.format('YYYY-MM-DD 23:59:59'),
            orderByAsc: false,
            orderKey: 'errorCount',
            pageIndex: 1,
            pageSize: 50,
            siteId: site.id,
            type: ['eventError', 'consoleError'],
            visitType: 0
          })
          .then((res) => {
            const { result } = res.data;
            if (result.totalCount > 0) {
              ret.push({
                name: site.name,
                totalCount: result.totalCount
              });
            }
          });
      },
      { concurrency: 4 }
    );
    this.spinner.succeed(
      `获取${chalk.yellow(yesterday.format('YYYY-MM-DD'))}报告成功`
    );
    console.log(
      ret
        .map(
          (item) =>
            `项目${chalk.blue(item.name)}有${chalk.red(item.totalCount)}个bug`
        )
        .join('\n')
    );
  }
}

export default (source: string) => {
  new Bug(source).run();
};
