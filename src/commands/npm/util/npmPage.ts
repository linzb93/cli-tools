import cheerio from 'cheerio';
import axios from 'axios';
import inquirer from 'inquirer';
import lodash from 'lodash';
const { get } = lodash;

class Npm {
    private $:any;
    private regData:any;
    constructor($, regData) {
        this.$ = $;
        this.regData = regData;
    }
    get(type) {
        const { $ } = this;
        if (type === 'repository') {
            return $('#repository').next().find('a')
                .attr('href');
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

export default async (pkg: string) => {
    let html = '';
    try {
        const [ htmlRes, registryRes ] = await Promise.all([
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
                .map((_, item) => (item.children[0] as any).data);
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
            throw new Error(e);
        }
    }
};
