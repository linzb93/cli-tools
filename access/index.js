// 检测网址是否可以访问
const axios = require('axios');
const cheerio = require('cheerio');
const pMap = require('p-map');
const ProgressBar = require('progress');
const iconvLite = require('iconv-lite');
const chalk = require('chalk');
const cliCursor = require('cli-cursor');
const clipboardy = require('clipboardy');
const ms = require('ms');
const {successLogger, errorLogger} = require('../lib/util');

module.exports = () => {
  axios.get('http://www.nd.com.cn/about/link.shtml', {
    responseType: 'arraybuffer'
  })
  .then(async res => {
    const $ = cheerio.load(iconvLite.decode(Buffer.concat([res.data]), 'gbk'));
    const siteList = [];
    let errorCounter = {
      count: 0,
      site: []
    };
    $('.product-link').find('td a').each(function () {
      siteList.push({
        title: $(this).text(),
        url: $(this).attr('href')
      });
    });
    const bar = new ProgressBar(':bar :current/:total', {
      total: siteList.length,
      width: siteList.length * 2,
      complete: chalk.bgGreen(' '),
      incomplete: chalk.bgWhite(' ')
    });
    cliCursor.hide();
    console.log('\n');
    const start = new Date().getTime();
    await pMap(siteList, async item => {
      try {
        await axios.get(item.url);
        bar.tick();
      } catch (e) {
        bar.tick();
        errorCounter.count++;
        let errMsg = '';
        if (e.response && e.response.statusText === 'Not Found') {
          errMsg = `${item.title} 网站不存在`;
        } else if (e.code === 'ETIMEDOUT') {
          errMsg = `${item.title} 访问超时`;
        } else {
          errMsg = `${item.title} 无法访问，${e}`;
        }
        errorCounter.site.push(errMsg);
        bar.interrupt(chalk.red(errMsg));
      }
      return Promise.resolve();
    })
    cliCursor.show();
    console.log('\n');
    console.log(`用时${ms(new Date().getTime() - start)}`);
    if (errorCounter.count) {
      errorLogger(`有${errorCounter.count}个网站无法访问`);
      clipboardy.writeSync(`http://777.nd.com.cn/news/link.html ${errorCounter.site.join()}，是否移除？`);
    } else {
      successLogger('所有网站均可正常访问');
    }
  })
  .catch(e => {
    errorLogger(e);
  });
}