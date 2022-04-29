import cheerio, { CheerioAPI } from 'cheerio';
import axios, { AxiosResponse } from 'axios';
import fs from 'fs-extra';
import path from 'path';
import pMap from 'p-map';
import { ref } from '@vue/reactivity';
import { watch } from '@vue/runtime-core';
import { root } from '../../util/helper.js';
import BaseCommand from '../../util/BaseCommand.js';
const resolve = (...src: string[]) => path.resolve(root, 'data/spider', ...src);

class Spider extends BaseCommand {
  private url: string;
  private dest: string;
  private static sourceMap = [
    {
      pattern: /^https:\/\/www.zhihu.com\/question\/\d+\/answer\/\d+$/,
      parser($: CheerioAPI): string[] {
        const $targets = $('.RichContent-inner').first().find('img');
        return Array.from(
          $targets.map((_, item) => $(item).attr('data-original'))
        );
      }
    }
  ];
  constructor(url: string, { dest = '' }) {
    super();
    this.url = url;
    this.dest = dest;
  }
  async run() {
    const { url, dest } = this;
    const matchSource = Spider.sourceMap.find((item) => item.pattern.test(url));
    if (!matchSource) {
      this.logger.error('页面无法解析，任务结束');
      return;
    }
    this.spinner.text = '开始爬取页面';
    let res: AxiosResponse;
    try {
      res = await axios({
        method: 'get',
        url
      });
    } catch (error) {
      this.spinner.fail('页面爬取失败，任务结束');
      return;
    }
    const $ = cheerio.load(res.data);
    const imgs = matchSource.parser($).map((img) => ({
      source: img,
      filename: path.basename(img.split('?')[0])
    }));
    await fs.mkdir(resolve(dest), { recursive: true });
    this.spinner.text = '正在下载图片';
    const downloadedCount = ref(0);
    watch(downloadedCount, (value) => {
      this.spinner.text = `已下载图片${value}张`;
    });
    await pMap(
      imgs,
      async (img) => {
        await this.helper.download(img.source, resolve(dest, img.filename));
        downloadedCount.value++;
      },
      { concurrency: 10 }
    );
    this.spinner.succeed(`下载完成，共下载${downloadedCount.value}张图片`);
  }
}

export default (url: string, options: any) => {
  new Spider(url, options).run();
};
