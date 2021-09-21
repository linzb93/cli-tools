const cheerio = require('cheerio');
const axios = require('axios');
const inquirer = require('inquirer');
const { get } = require('lodash');
module.exports = async package => {
    let html = '';
    try {
        const res = await axios.get(`https://www.npmjs.com/package/${package}`);
        html = res.data;
    } catch (e) {
        // 没找到
        if (get(e, 'response.status') === 404) {
            const res = await axios.get(`https://www.npmjs.com/search?q=${package}`);
            html = res.data;
            const $ = cheerio.load(html);
            const list = $('.d0963384')
            .find('.db7ee1ac')
            .filter(index => index <= 10)
            .map((_, item) => item.children[0].data);
            const choices = Array.prototype.slice.call(list);
            if (choices.length) {
                throw new Error('检测到您输入的npm依赖有误');
            }
            const {pkg} = await inquirer.prompt([{
                type: 'list',
                name: 'pkg',
                message: '检测到您输入的npm依赖有误，请选择下面其中一个',
                choices: choices
            }]);
             res = await axios.get(`https://www.npmjs.com/package/${pkg}`);
            html = res.data;
        } else {
            throw new Error(e);
            return;
        }
    }
    const $ = cheerio.load(html);
    return new Npm($);
}

class Npm {
    constructor($) {
        this.$ = $;
    }
    get(type) {
        const {$} = this;
        if (type === 'repository') {
            return $('#repository').next().find('a').attr('href');
        }
        if (type === 'description') {
            const $firstP = $('article p').first();
            return $firstP.text().trim() === '' ? $firstP.next().text().trim() : $firstP.text().trim();
        }
        if (type === 'weeklyDl') {
            return $('._9ba9a726').text();
        }
        if (type === 'lastPb') {
            return $('.f2874b88 time').text();
        }
        return '';
    }
}