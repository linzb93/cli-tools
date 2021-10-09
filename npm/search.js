const open = require('open');
const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');
const Table = require('cli-table3');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const logger = require('../lib/logger');
const npmPage = require('./_internal/npmPage');

const adapter = new FileSync(path.resolve(__dirname, 'db.json'));
const db = low(adapter);
const table = new Table({
    head: [
        chalk.green('名称'),
        chalk.green('周下载量'),
        chalk.green('上次更新')
    ]
});
db
    .defaults({ items: [] })
    .write();

function transformNumberCn(val) {
    // 12,345,678 => 1234万
    const value = Number(val.replace(/,/g, ''));
    if (value > 10000) {
        return `${parseInt(value / 10000)}万`;
    }
    return value;
}

// 获取单个包信息
async function fetchNpmPackage(packageName, isMultiple) {
    let spinner;
    if (!isMultiple) {
        spinner = ora(`正在查找 ${packageName} 模块`).start();
    }
    // 先从本地获取，如果没有数据，再从远程获取
    let data = {};
    const searchItems = db.get('items').filter(item => item.name === packageName).value();
    if (searchItems.length) {
        data = {
            name: packageName,
            desc: searchItems[0].desc,
            weeklyDl: transformNumberCn(searchItems[0].weeklyDl),
            lastPb: searchItems[0].lastPb,
            homepage: searchItems[0].homepage
        };
        if (isMultiple) {
            return data;
        }
    } else {
        const page = await npmPage(packageName);
        data = {
            name: packageName,
            desc: page.get('desc'),
            weeklyDl: page.get('weeklyDl'),
            lastPb: page.get('lastPb')
        };

        // 将搜索结果存入本地，下次查询时直接从本地获取
        db.get('items').push(data).write();
        data.weeklyDl = transformNumberCn(data.weeklyDl);
        if (isMultiple) {
            return data;
        }
    }
    spinner.stop();
    console.log(`${chalk.bold(`关于${packageName}`)}:
  ${data.desc}
  周下载量：${chalk.green(data.weeklyDl)}
  上次更新：${chalk.green(data.lastPb)}`);
    const { openNpmPage } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'openNpmPage',
            message: '是否打开npm页面？',
            default: false
        }
    ]);
    if (openNpmPage) {
        open(`https://npmjs.com/package/${packageName}`);
    }
}

// 获取多个包信息并比较
async function fetchMulNpmPackage(args) {
    const spinner = ora(`正在查找 ${args.join(' ')} 这些模块`).start();
    let resList;
    try {
        resList = await Promise.all(args.map(arg => {
            return fetchNpmPackage(arg, true);
        }));
    } catch (e) {
        if (e.response && e.response.statusText === 'Not Found') {
            spinner.fail(`没有 ${e.config.url.split('/').pop()} 这个模块`);
        } else {
            spinner.fail('无法访问');
        }
        process.exit(0);
    }
    spinner.stop();
    table.push(...resList.map(item => [ item.name, item.weeklyDl, item.lastPb ]));
    console.log(table.toString());
}

module.exports = async args => {
    if (args.length === 1) {
        fetchNpmPackage(args[0], false);
    } else if (args.length > 1) {
        fetchMulNpmPackage(args);
    } else {
        logger.error('未检测到 package 名称，退出程序。');
    }
};
