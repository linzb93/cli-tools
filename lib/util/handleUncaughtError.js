const inquirer = require('inquirer');
const boxen = require('boxen');
const createCallsiteRecord = require('callsite-record');
const path = require('path');
const chalk = require('chalk');
const consola = require('consola');
const { openInEditor } = require('./');
const getSetting = require('./db');

module.exports = () => {
    process.on('uncaughtException', async e => {
        errorHandler(e);
    });
    process.on('unhandledRejection', async e => {
        errorHandler(e, {
            async: true
        });
    });
};

// 处理全局未捕捉的错误
async function errorHandler(e, options = {}) {
    try {
        console.log(boxen(`${chalk.bold.red('UNCAUGHTED ERROR!')}\n${e.message}`, {
            align: 'center',
            borderColor: 'red',
            dimBorder: true,
            padding: 1,
            margin: 1,
            float: 'left'
        }));
        console.log(createCallsiteRecord({ forError: e }).renderSync());
        if (getSetting('debug')) {
            process.exit(1);
        }
        const ans = await inquirer.prompt([{
            type: 'confirm',
            message: `发现未处理的${options.async ? '异步' : ''}错误，是否打开编辑器修复bug？`,
            name: 'open'
        }]);
        if (ans.open) {
            openInEditor(path.resolve(__dirname, '../../'));
        } else {
            process.exit(0);
        }
    } catch (error) {
        consola.error(error.message);
    }
}