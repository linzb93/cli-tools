const open = require('open');
const ora = require('ora');
const chalk = require('chalk');
const Table = require('cli-table3');
const consola = require('consola');
const npmPage = require('./_internal/npmPage');
const table = new Table({
    head: [
        chalk.green('名称'),
        chalk.green('简介'),
        chalk.green('周下载量'),
        chalk.green('上次更新')
    ],
    colAligns: [ 'center', 'center', 'center', 'center' ]
});

// 获取单个包信息
async function fetchNpmPackage(packageName, isMultiple, options) {
    let spinner;
    if (!isMultiple) {
        spinner = ora(`正在查找 ${packageName} 模块`).start();
    }
    const page = await npmPage(packageName);
    const data = {
        name: packageName,
        description: page.get('description'),
        weeklyDl: page.get('weeklyDl'),
        lastPb: page.get('lastPb')
    };
    data.weeklyDl = transformNumberCn(data.weeklyDl);
    if (isMultiple) {
        return data;
    }
    spinner.stop();
    console.log(`${chalk.bold(`关于${packageName}`)}:
    ${data.description}
  周下载量：${chalk.green(data.weeklyDl)}
  上次更新：${chalk.green(data.lastPb)}`);
    if (options && options.open) {
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
    table.push(...resList.map(item => [ item.name, lineFeed(item.description), item.weeklyDl, item.lastPb ]));
    console.log(table.toString());
}

module.exports = async (args, options) => {
    if (args.length === 1) {
        fetchNpmPackage(args[0], false, options);
    } else if (args.length > 1) {
        fetchMulNpmPackage(args);
    } else {
        consola.error('未检测到依赖名称。');
    }
};

// 12,345,678 => 1234万
function transformNumberCn(val) {
    const value = Number(val.replace(/,/g, ''));
    if (value > 10000) {
        return `${parseInt(value / 10000)}万`;
    }
    return value;
}

function lineFeed(str, perLineLength = 30) {
    const strArr = str.split(' ');
    let tempArr = [];
    const retArr = [];
    strArr.forEach(s => {
        tempArr.push(s);
        if (tempArr.reduce((sum, item) => sum + item + ' ', '').length > perLineLength) {
            retArr.push(tempArr.join(' '));
            tempArr = [];
        }
    });
    if (tempArr.length) {
        retArr.push(tempArr.join(' '));
    }
    return retArr.join('\n');
}
