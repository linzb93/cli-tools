const cheerio = require('cheerio');
const axios = require('axios');

module.exports = async package => {
    let html = '';
    try {
        const res = await axios.get(`https://www.npmjs.com/package/${package}`);
        html = res.data;
    } catch (e) {
        // 没找到
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
        return '';
    }
}