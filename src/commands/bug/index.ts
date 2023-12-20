import BaseCommand from '../../util/BaseCommand.js';
import fs from 'fs-extra';
import dayjs from 'dayjs';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import pMap from 'p-map';
import xlsx from 'node-xlsx';
import lodash from 'lodash';
import open from 'open';
import sitemap from './sitemap.js';
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
    const range = `${dayjs()
      .subtract(3, 'd')
      .format('YYYY-MM-DD')}~${yesterday.format('YYYY-MM-DD')}`;
    this.spinner.succeed(
      `【${chalk.yellow(
        dayjs().day() !== 1 ? yesterday.format('YYYY-MM-DD') : range
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

export function generate(list: any[]) {}
