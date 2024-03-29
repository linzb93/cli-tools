import * as cheerio from 'cheerio';
import boxen from 'boxen';
import axios from 'axios';
import chalk from 'chalk';
import Table from 'cli-table3';
import BaseCommand from '../util/BaseCommand.js';
import open from 'open';
interface Options {
  example: boolean;
}

class Translate extends BaseCommand {
  private text: string;
  private options: Options;
  private isC2E: boolean; // 中文翻译成英文
  constructor(text: string, options: Options) {
    super();
    this.text = text;
    this.isC2E = !/[a-z]+/.test(text);
    this.options = options;
  }
  async run() {
    const { options, text, isC2E } = this;
    this.spinner.text = '正在查找';
    try {
      const { data } = await axios.get(
        `https://youdao.com/w/eng/${encodeURIComponent(text)}/`
      );
      const $ = cheerio.load(data);
      const meanings = Array.from(
        $('.trans-container')
          .first()
          .children('ul')
          .children()
          .map((_, item) => {
            const typeRet = $(item).text().replace(/\s/g, '');
            if (typeRet.includes('.')) {
              const type = typeRet.split('.')[0];
              return `${chalk.gray(type)} ${typeRet.split('.')[1]}`;
            }
            return typeRet;
          })
      );
      this.spinner.stop();
      if (!meanings.length) {
        await open(`https://youdao.com/w/eng/${encodeURIComponent(text)}`);
        return;
      }
      if (options.example) {
        const arrs: { en: string; cn: string }[] = [];
        $('#bilingual')
          .find('li')
          .filter((index) => index < 2)
          .each((_, item) => {
            const $list = $(item).children('p');
            const $en = isC2E ? $list.eq(1) : $list.first();
            const enText = Array.from(
              $en.children('span').map((_, sub) => $(sub).text())
            ).join('');
            const $cn = isC2E ? $list.first() : $list.eq(1);
            const cnText = Array.from(
              $cn.children('span').map((_, sub) => $(sub).text())
            ).join('');
            if (isC2E) {
              arrs.push({
                en: enText,
                cn: cnText.replace(text, chalk.green(text))
              });
            } else {
              arrs.push({
                en: enText.replace(text, chalk.green(text)),
                cn: cnText
              });
            }
          });
        const table = new Table({
          head: [chalk.green('含义'), chalk.green('范例')],
          colAligns: ['left', 'left']
        });
        table.push([
          meanings.join('\n\n'),
          arrs
            .map((item, index) => {
              if (isC2E) {
                return `${index + 1}.${item.cn}\n${item.en}`;
              } else {
                return `${index + 1}.${item.en}\n${item.cn}`;
              }
            })
            .join('\n\n')
        ]);
        console.log(table.toString());
      } else {
        console.log(
          boxen(meanings.join('\n\n'), {
            align: 'left',
            borderColor: 'green',
            borderStyle: 'classic',
            title: '含义',
            titleAlignment: 'center',
            dimBorder: true,
            width: 100,
            padding: 1,
            margin: 1,
            float: 'left'
          })
        );
      }
    } catch (error) {
      this.spinner.fail('服务器故障，请稍后再试');
      console.log(error);
    }
  }
}

export default (text: string, options: Options) => {
  new Translate(text, options).run();
};
