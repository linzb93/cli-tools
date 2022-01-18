const inquirer = require('inquirer');
const db = require('./db');
const addCode = require('../add');
const spinner = require('../../../util/spinner');

exports.checkDownloadCode = async code => {
    if (!db.fund.has(code)) {
        const { confirm } = await inquirer.prompt([{
            type: 'confirm',
            message: '该基金代码不存在，是否下载？',
            name: 'confirm'
        }]);
        if (confirm) {
            spinner.text = '正在下载';
            try {
                const name = await addCode(code, {
                    silent: true
                });
                spinner.succeed(`${name}信息添加成功`);
            } catch (error) {
                spinner.fail(`基金${code}不存在`);
                process.exit(1);
            }
        }
    }
};

exports.validateCode = code => {
    if (!/[0-9]{6}/.test(code)) {
        throw new Error('请输入6位数基金代码');
    }
};
