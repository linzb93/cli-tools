import publicIp from 'public-ip';
import internalIp from 'internal-ip';
import chalk from 'chalk';
import axios from 'axios';
import { load } from 'cheerio';
import Table from 'cli-table3';
import BaseCommand from '../BaseCommand';

export default class extends BaseCommand {
    async main(data?: string[]) {
        if (data[0] === 'get') {
            this.getIpLocation(data[1]);
            return;
        }
        this.spinner.text = '正在获取IP';
        const [iIp, pIp] = await Promise.all([internalIp.v4(), publicIp.v4()]);
        this.spinner.succeed(`内网IP: ${chalk.cyan(iIp)}
  公网IP: ${chalk.cyan(pIp)}`);
        // ipv6就不要了，时间很久，不知道能不能获取。
    }
    /**
     * 获取IP归属地
     */
    private async getIpLocation(ip: string) {
        this.spinner.text = '正在查询IP信息';
        let html = '';
        try {
            const { data } = await axios.get(`https://www.ip138.com/iplookup.php?ip=${ip}&action=2`, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
                timeout: 10000,
            });
            html = data;
        } catch (error) {
            this.spinner.fail('查询失败:' + error.message);
            return;
        }
        const $ = load(html);
        let output = $('tbody')
            .first()
            .children()
            .map(function (_, el) {
                const $childrens = $(el).children();
                const label = $childrens.first().text();
                const data = $childrens.last().text();
                return [label, data];
            })
            .toArray();
        if (!output[1]) {
            this.logger.info('无搜索结果');
            return;
        }
        const table = new Table();
        table.push(
            {
                [chalk.green('IP')]: ip,
            },
            {
                [chalk.green(output[0])]: output[1].replace(/\n/g, ''),
            },
            {
                [chalk.green(output[2])]: output[3],
            }
        );
        if (!output[2]) {
            table.pop();
        }
        this.spinner.succeed(`查询成功
${table.toString()}`);
    }
}
