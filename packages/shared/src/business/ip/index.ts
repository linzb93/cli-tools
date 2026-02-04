import { resolve4 } from 'node:dns';
import { Socket } from 'node:net';
import publicIp from 'public-ip';
import internalIp from 'internal-ip';
import chalk from 'chalk';
import axios from 'axios';
import { load } from 'cheerio';
import Table from 'cli-table3';
import { BaseService } from '@cli-tools/shared/src/base/BaseService';
import { defaultBrowserHeaders } from '@cli-tools/shared/src/utils/helper';

export class IpService extends BaseService {
    async main(data?: string[]) {
        if (data[0] && data[0].match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
            this.getIpLocation(data[0]);
            return;
        }
        if (!!data[0]) {
            this.getWebsiteIpAndPort(data[0]);
            return;
        }
        this.spinner.text = '正在获取IP';
        const [iIp, pIp] = await Promise.all([internalIp.v4(), publicIp.v4()]);
        this.spinner.succeed(`内网IP: ${chalk.hex('#ffa500')(iIp)}
  公网IP: ${chalk.hex('#ffa500')(pIp)}`);
        // 公网ipv6就不要了，时间很久，不知道能不能获取。内网的没有ipv6。
    }
    /**
     * 获取IP归属地
     */
    private async getIpLocation(ip: string) {
        this.spinner.text = '正在查询IP信息';
        let html = '';
        try {
            const { data } = await axios.get(`https://www.ip138.com/iplookup.php?ip=${ip}&action=2`, {
                headers: defaultBrowserHeaders,
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
            this.spinner.fail('无搜索结果');
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
            },
        );
        if (!output[2]) {
            table.pop();
        }
        this.spinner.succeed(`查询成功
${table.toString()}`);
    }
    /**
     * 获取网站IP和端口
     */
    private async getWebsiteIpAndPort(website: string) {
        this.spinner.text = '正在查询网站IP和端口';
        Promise.all([
            new Promise((resolve) => {
                const socket = new Socket();
                socket.connect(443, website, () => {
                    socket.end();
                    resolve(socket.remotePort);
                });
            }),
            new Promise((resolve, reject) => {
                resolve4(website, (err, address) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(address);
                });
            }),
        ])
            .then(([port, ip]: [number, string[]]) => {
                this.spinner.succeed(`查询成功
${ip.join('\n')}
端口: ${port}`);
            })
            .catch((err) => {
                this.spinner.fail('查询失败:' + err.message);
            });
    }
}
