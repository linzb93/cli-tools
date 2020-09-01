const axios = require('axios');
const cheerio = require('cheerio');
const open = require('open');
const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');
const Table = require('cli-table3');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const {errorLogger} = require('../lib/util');

const adapter = new FileSync(path.resolve(__dirname, 'db.json'))
const db = low(adapter)
const table = new Table({
  head: [chalk.green('名称'), chalk.green('周下载量')]
});
db
.defaults({ items: []})
.write();

function transformNumberCn(val) {
  // 12,345,678 => 1234万
  var value = Number(val.replace(/,/g, ''));
  if (value > 10000) {
    return `${parseInt(value / 10000)}万`;
  }
  return value;
}

// 获取单个包信息
async function fetchNp(packageName) {
  let spinner = ora(`正在查找 ${packageName} 模块`).start();
  
  // 先从本地获取，如果没有数据，再从远程获取
  let data = {};
  const searchItems = db.get('items').filter(item => item.name === packageName).value();
  if (searchItems.length) {
    data = {
      desc: searchItems[0].desc,
      weeklyDl: transformNumberCn(searchItems[0].weeklyDl),
      lastPb: searchItems[0].lastPb,
      homepage: searchItems[0].homepage
    }
  } else {
    let res;
    try {
      res = await axios.get(`https://www.npmjs.com/package/${packageName}`);
    } catch(e) {
      if (e.response && e.response.statusText === 'Not Found') {
        spinner.fail(`没有 ${packageName} 这个模块`);
      } else if (e.code === 'ETIMEDOUT') {
        spinner.fail(`访问超时`);
      } else {
        spinner.fail(`无法访问`);
      }
      process.exit(0);
    }
    const $ = cheerio.load(res.data);
    if (!$('._9ba9a726').length) {
      errorLogger(`可能 https://npmjs.com 重新发布，请修改。`);
      return;
    }
    /**
    * 获取描述文字
    * 如果第一段是徽章，就获取第二段，否则移除第一段里面的html标签
    */
    const $firstP = $('article p').first();
    const homepageBlock = $('.fdbf4038').children().filter(function() {
      return $(this).find('h3').text().toLowerCase() === 'homepage';
    });
    data = {
      name: packageName,
      desc: $firstP.text().trim() === '' ? $firstP.next().text().trim() : $firstP.text().trim(),
      weeklyDl: $('._9ba9a726').text(),
      lastPb: $('.f2874b88 time').text(),
      homepage: homepageBlock ? homepageBlock.find('a').attr('href'): null
    };

    // 将搜索结果存入本地，下次查询时直接从本地获取
    db.get('items').push(data).write();
    data.weeklyDl = transformNumberCn(data.weeklyDl);
  }
  spinner.stop();
  console.log(`${chalk.bold(`关于${packageName}`)}:
  ${data.desc}
  周下载量：${chalk.green(data.weeklyDl)}
  上次更新：${chalk.green(data.lastPb)}`);
  if (data.homepage) {
    const { openHomepage } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'openHomepage',
        message: '是否打开Github主页？',
        default: false
      }
    ]);
    if (openHomepage) {
      open(data.homepage);
    }
  }
}

// 获取多个包信息并比较
async function fetchMulNp(args) {
  let spinner = ora(`正在查找 ${args.join(' ')} 这些模块`).start();
    let resList;
    try {
      resList = await Promise.all(args.map(arg => axios.get(`https://www.npmjs.com/package/${arg}`)));
    } catch(e) {
      if (e.response && e.response.statusText === 'Not Found') {
        spinner.fail(`没有 ${e.config.url.split('/').pop()} 这个模块`);
      } else {
        spinner.fail(`无法访问`);
      }
      process.exit(0);
    }
    spinner.stop();
    const retList = resList.map(res => {
      const $ = cheerio.load(res.data);
      if (!$('._9ba9a726').length) {
        errorLogger(`可能 https://npmjs.com 重新发布，请修改。`);
        process.exit(0);
      }
      let obj = [];
      const key = res.config.url.split('/').pop();
      obj.push(key, transformNumberCn($('._9ba9a726').text()));
      return obj;
    });
    table.push(...retList);
    console.log(table.toString());
}

module.exports = async args => {
  if (args.length === 1) {
    fetchNp(args[0])
  } else if (args.length > 1) {
    fetchMulNp(args);
  } else {
    const {packageName} = await inquirer.prompt([
      {
        type: 'input',
        message: '请输入需要查找的 package 名称',
        default: null,
        name: 'packageName'
      }
    ]);
    const pkg = packageName.split(' ');
    if (pkg.length === 1 && pkg[0]) {
      fetchNp(pkg[0])
    } else if (pkg.length > 1) {
      fetchMulNp(pkg);
    } else {
      errorLogger('未检测到 package 名称，退出程序。');
    }
  }
};