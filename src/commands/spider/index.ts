import cheerio from 'cheerio';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import pMap from 'p-map';
import ora from 'ora';
import { ref } from '@vue/reactivity';
import { watch } from '@vue/runtime-core';
import logger from '../../util/logger';
import BaseCommand from '../../util/BaseCommand';
const resolve = (...src) => path.resolve(__dirname, ...src);
const sourceMap = [
    {
        pattern: /https:\/\/www.zhihu.com\/question\/\d+\/answer\/\d+/,
        parser($): string[] {
            const $targets = $('.RichContent-inner').first().find('img');
            return Array.from($targets.map((index, item) => $(item).attr('data-original')));
        }
    }
];

export default class extends BaseCommand {
    private url: string;
    private dest: string
    constructor(url, { dest = '' }) {
        super();
        this.url = url;
        this.dest = dest;
    }
    async run() {
        const { url, dest } = this;
        const matchSource = sourceMap.find(item => item.pattern.test(url));
        if (!matchSource) {
            logger.error('页面无法解析，任务结束');
            return;
        }
        const spinner = ora('开始爬取页面').start();
        let res;
        try {
            res = await axios({
                method: 'get',
                url
            });
        } catch (error) {
            spinner.fail('页面爬取失败，任务结束');
            return;
        }
        const $ = cheerio.load(res.data);
        const imgs = matchSource.parser($).map(img => ({
            source: img,
            filename: path.basename(img.split('?')[0])
        }));
        await fs.mkdir(resolve(`images/${dest}`), { recursive: true });
        spinner.text = '正在下载图片';
        const downloadedCount = ref(0);
        watch(downloadedCount, value => {
            spinner.text = `已下载图片${value}张`;
        });
        await pMap(imgs, async img => {
            const { data } = await axios({
                method: 'get',
                url: img.source,
                responseType: 'stream'
            });
            const ws = fs.createWriteStream(resolve('images', dest, img.filename));
            data.pipe(ws);
            await new Promise(resolve => {
                ws.on('finish', () => {
                    downloadedCount.value++;
                    resolve(null);
                });
            });
        }, { concurrency: 10 });
        spinner.succeed(`下载完成，共下载${downloadedCount.value}张图片`);
    };

}