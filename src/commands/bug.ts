import BaseCommand from '../util/BaseCommand.js';
import fs from 'fs-extra';
import dayjs from 'dayjs';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import pMap from 'p-map';
import xlsx from 'node-xlsx';
import lodash from 'lodash';
import open from 'open';
const { flatten } = lodash;

interface Options {
  debug: Boolean;
  all: Boolean;
}

class Bug extends BaseCommand {
  private source: string;
  private options: Options;
  constructor(source: string, options: Options) {
    super();
    this.source = source;
    this.options = options;
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
        name: '美团-商品大师',
        id: 'ec51352d850027711f9942f1fb6e3f40'
      },
      {
        name: '美团闪购',
        id: '6dd82bbfa54c6275583de5705ee0a7a8'
      },
      {
        name: '品牌连锁数据分析',
        id: 'e7500e2a12510c1e42ed5eaa17f65ac0'
      }
    ];
    const prefix = this.ls.get('oa.apiPrefix');
    const yesterday = dayjs().subtract(1, 'd');
    let beginTime = yesterday.format('YYYY-MM-DD 00:00:00');
    const endTime = yesterday.format('YYYY-MM-DD 23:59:59');
    if (dayjs().day() === 1) {
      beginTime = dayjs().subtract(3, 'd').format('YYYY-MM-DD 00:00:00');
    }
    const ret: { name: string; totalCount: number; list: any[] }[] = [];
    this.spinner.text = '正在获取报告';
    const siteList = !this.options.all
      ? sitemap.filter((site) => ['美团-经营神器'].includes(site.name))
      : sitemap;
    await pMap(
      siteList,
      async (site) => {
        const response = await axios.post(
          `${prefix}/dataanaly/data/analysis/jsErrorCount`,
          {
            beginTime,
            endTime,
            orderByAsc: false,
            orderKey: 'errorCount',
            pageIndex: 1,
            pageSize: 50,
            siteId: site.id,
            type: ['eventError', 'consoleError'],
            visitType: 0
          }
        );
        const { result } = response.data;
        if (result.totalCount === 0) {
          return;
        }
        const list = await pMap(
          result.list,
          async (item: any) => {
            if (
              item.content.startsWith('Cannot read properties of undefined')
            ) {
              const res = await axios.post(
                `${prefix}/dataanaly/data/analysis/getVisitInfo`,
                {
                  beginTime,
                  endTime,
                  content: item.content,
                  keyWord: '',
                  pageIndex: 1,
                  pageSize: 1,
                  siteId: site.id,
                  type: ['eventError', 'consoleError'],
                  url: item.url
                }
              );
              const { result } = res.data;
              if (result.totalCount === 0) {
                return item;
              }
              const regMatch = result.list[0].errorMsg.match(/at (\S+)/);
              if (!regMatch) {
                return item;
              }
              return {
                ...item,
                track: regMatch[1]
              };
            } else {
              return item;
            }
          },
          { concurrency: 4 }
        );
        ret.push({
          name: site.name,
          totalCount: result.totalCount,
          list
        });
      },
      { concurrency: 4 }
    );
    this.spinner.succeed(
      `【${chalk.yellow(
        dayjs().day() !== 1
          ? yesterday.format('YYYY-MM-DD')
          : `${dayjs().subtract(3, 'd').format('YYYY-MM-DD')}~${yesterday}`
      )}】获取报告成功`
    );
    const excelData = [
      {
        name: '报告结果',
        data: ret.map((proj) => {
          const title = [`${proj.name} （${proj.totalCount}个bug）`];
          const tableTitle = [
            '错误信息',
            '发生页面',
            '浏览量',
            '影响客户数',
            '错误栈'
          ];
          const content = proj.list.map((item) => [
            item.content,
            item.url,
            item.errorCount,
            item.numberOfAffectedUsers,
            item.track
          ]);
          return [title, tableTitle, ...content, []];
        })
      }
    ] as any;
    excelData[0].data = flatten(excelData[0].data);
    const buffer = xlsx.build(excelData, {
      sheetOptions: {
        '!cols': [{ wch: 80 }, { wch: 60 }, { wch: 6 }, { wch: 6 }, { wch: 50 }]
      }
    });
    const filePath = `${this.helper.desktop}/前端监控报告.xlsx`;
    fs.writeFile(filePath, buffer).then(() => {
      open(filePath);
    });
  }
}

export default (source: string, options: Options) => {
  new Bug(source, options).run();
};
