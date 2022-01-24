import cheerio, { CheerioAPI, Node as CheerioNode } from 'cheerio';
import axios, { AxiosResponse } from 'axios';
import inquirer from 'inquirer';
import lodash from 'lodash';

const { get } = lodash;
interface RegData {
    description: string
}
// 本来CheerioNode上应该有data属性的，但作者没写。
interface ExtCheerioNode extends CheerioNode {
    data: string
}

export class Npm {
    private $: CheerioAPI;
    private regData: RegData;
    constructor($: CheerioAPI, regData: RegData) {
        this.$ = $;
        this.regData = regData;
    }
    get(type: string): string {
        const { $ } = this;
        if (type === 'repository') {
            return $('#repository').next().find('a')
                .attr('href') as string;
        }
        if (type === 'weeklyDl') {
            return $('._9ba9a726').text();
        }
        if (type === 'lastPb') {
            return $('.f2874b88 time').text();
        }
        if (type === 'description') {
            return this.regData.description;
        }
        return '';
    }
}
export default async (pkg: string): Promise<Npm> => {
    let html = '';
    try {
        const [htmlRes, registryRes] = await Promise.all([
            axios.get(`https://www.npmjs.com/package/${pkg}`),
            axios.get(`https://registry.npmjs.com/${pkg}/latest`)
        ]);
        html = htmlRes.data;
        const $ = cheerio.load(html);
        return new Npm($, registryRes.data);
    } catch (e) {
        // 没找到
        if (get(e, 'response.status') === 404) {
            let res = await axios.get(`https://www.npmjs.com/search?q=${pkg}`);
            html = res.data;
            const $ = cheerio.load(html);
            const list = $('.d0963384')
                .find('.db7ee1ac')
                .filter(index => index <= 10)
                .map((_, item) => (item.children[0] as ExtCheerioNode).data);
            const choices = Array.prototype.slice.call(list);
            if (choices.length) {
                throw new Error('检测到您输入的npm依赖有误');
            }
            const { pkgAns } = await inquirer.prompt([{
                type: 'list',
                name: 'pkgAns',
                message: '检测到您输入的npm依赖有误，请选择下面其中一个',
                choices
            }]);
            res = await axios.get(`https://www.npmjs.com/package/${pkgAns}`);
            html = res.data;
        } else {
            throw e;
        }
    }
};
