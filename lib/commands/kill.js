const inquirer = require('inquirer');
const rawKillPort = require('kill-port');
const iconv = require('iconv-lite');
const chalk = require('chalk');
const logger = require('../util/logger');

const numberRE = /[1-9][0-9]*/;
module.exports = async args => {
    if (args.length === 1) {
        if (!numberRE.test(args[0])) {
            logger.error('端口号或者进程ID格式不正确，只能输入数字');
            return;
        }
        const id = Number(args[0]);
        if (id < 1000 && !await confirm()) {
            return;
        }
        try {
            await killPort(id);
            logger.success(`端口 ${chalk.yellow(id)} 关闭成功`);
            return;
        } catch {
            //
        }
        try {
            process.kill(id);
        } catch (error) {
            logger.error(`不存在端口号为 ${chalk.yellow(id)} 的或进程ID为 ${chalk.yellow(id)} 的进程`);
            return;
        }
        logger.success(`进程 ${chalk.yellow(id)} 关闭成功`);
    } else if (args.length === 2) {
        const [ target, idStr ] = args;
        let id;
        if (target === 'port') {
            if (!numberRE.test(idStr)) {
                logger.error('端口号格式不正确，只能输入数字');
                return;
            }
            id = Number(idStr);
            try {
                await killPort(id);
                logger.success(`端口 ${chalk.yellow(id)} 关闭成功`);
                return;
            } catch (error) {
                logger.error(`端口 ${chalk.yellow(id)} 不存在`);
            }
        } else if (target === 'pid') {
            if (!numberRE.test(idStr)) {
                logger.error('进程ID格式不正确，只能输入数字');
                return;
            }
            id = Number(idStr);
            if (id < 1000 && !await confirm()) {
                return;
            }
            try {
                process.kill(id);
                logger.success(`进程 ${chalk.yellow(id)} 关闭成功`);
            } catch (error) {
                logger.error(`进程ID为 ${chalk.yellow(id)} 的进程不存在`);
                return;
            }
        } else {
            logger.error('命令不正确，请输入进程ID: pid，或者端口号: port');
        }
    }
};
async function confirm() {
    const ans = await inquirer.prompt([{
        type: 'confirm',
        message: '您可能要关闭系统进程，确认是否继续？',
        name: 'data',
        default: false
    }]);
    return ans.data;
}
async function killPort(port) {
    return new Promise((resolve, reject) => {
        rawKillPort(port, 'tcp')
            .then(data => {
                if (data.stderr) {
                    reject(iconv.decode(Buffer.from(data.stderr), 'utf8'));
                } else {
                    resolve();
                }
            })
            .catch(reject);
    });
}
