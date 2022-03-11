import * as cheerio from 'cheerio';
import boxen from 'boxen';
import axios from 'axios';
import chalk from 'chalk';
import Table from 'cli-table3';
import lodash from 'lodash';
import BaseCommand from '../util/BaseCommand.js';

interface Options {
  example: boolean;
}
const { last } = lodash;

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
          const typeRet = this.chunk($(item).text().replace(/\s/g, ''));
          if (typeRet.includes('.')) {
            const type = typeRet.split('.')[0];
            return `${chalk.gray(type)} ${typeRet.split('.')[1]}`;
          }
          return typeRet;
        })
    );
    this.spinner.stop();
    if (options.example) {
      const arrs: { en: string; cn: string }[] = [];
      $('#bilingual')
        .find('li')
        .filter((index) => index < 2)
        .each((_, item) => {
          const $list = $(item).children('p');
          const $en = isC2E ? $list.eq(1) : $list.first();
          const enText = this.chunk(
            Array.from(
              $en.children('span').map((_, sub) => $(sub).text())
            ).join('')
          );
          const $cn = isC2E ? $list.first() : $list.eq(1);
          const cnText = this.chunk(
            Array.from(
              $cn.children('span').map((_, sub) => $(sub).text())
            ).join('')
          );
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
  }
  chunk(str: string): string {
    // 30个字母一行，不隔断一个单词
    const isEn = /^[a-zA-Z0-9,\.\?\s\']+$/.test(str);
    const lineLength = isEn ? 40 : 20;
    const data = str.split(isEn ? ' ' : '');
    const result: string[] = [''];
    for (let index = 0; index < data.length; index++) {
      const item = last(result) as string;
      if (item.length < lineLength) {
        result[result.length - 1] += data[index] + (isEn ? ' ' : '');
      } else {
        result.push(data[index] + (isEn ? ' ' : ''));
      }
    }
    return result.join('\n');
    // const data = str.split('');
    // return chunk(data, 30)
    //   .map((item) => item.join(''))
    //   .join('\n');
  }
}

export default (text: string, options: Options) => {
  new Translate(text, options).run();
};
