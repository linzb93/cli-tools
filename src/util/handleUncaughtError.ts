import inquirer from 'inquirer';
import boxen from 'boxen';
import createCallsiteRecord from 'callsite-record';
import path from 'path';
import chalk from 'chalk';
import logger from './logger.js';
import { openInEditor, root } from './helper.js';

module.exports = () => {
    process.on('uncaughtException', async e => {
        errorHandler(e);
    });
    process.on('unhandledRejection', async e => {
        errorHandler(e as Error, {
            async: true
        });
    });
};

// 处理全局未捕捉的错误
async function errorHandler(e: Error, options:{
    async?:boolean
} = {}) {
    logger.clearConsole(1);
    try {
        console.log(boxen(`${chalk.bold.red('UNCAUGHTED ERROR!')}\n${e.message}`, {
            align: 'center',
            borderColor: 'red',
            dimBorder: true,
            padding: 1,
            margin: 1,
            float: 'left'
        }));
        console.log(createCallsiteRecord({ forError: e }).renderSync({}));
        if (process.cwd() === root) {
            return;
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
        logger.error(error.message);
    }
}