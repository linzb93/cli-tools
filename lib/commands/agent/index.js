const chalk = require('chalk');
const inquirer = require('inquirer');
const path = require('path');
const { fork } = require('child_process');
const { pick } = require('lodash');
const consola = require('consola');
const { db } = require('./util');
const { processArgvToFlags, validate, root } = require('../../util');
const monitor = require('../monitor');

module.exports = async (subCommand, options) => {
    if (subCommand === 'stop') {
        require('./stop')();
        return;
    } else if (subCommand !== '') {
        consola.error('命令不存在，请重新输入');
        return;
    }
    validate(options, {
        proxy: [
            {
                pattern: '',
                message: '格式不合法，请输入网址类型的'
            }
        ],
        port: [
            {
                message: '端口号请输入1000以上的整数'
            }
        ]
    });
    const cacheData = db.get('items').value();
    const match = cacheData.find(item => item.proxy === options.proxy);
    if (!match) {
        if (!options.proxy) {
            const { server } = await inquirer.prompt([{
                message: '请选择要开启的代理服务器',
                type: 'list',
                choices: cacheData.map(data => ({
                    name: `${data.name} ${chalk.green(`(${data.proxy})`)}`,
                    value: data.proxy
                })),
                name: 'server'
            }]);
            options.proxy = server;
        } else {
            const ans = await inquirer.prompt([
                {
                    type: 'confirm',
                    message: '是否将服务器数据存入缓存？',
                    name: 'choosed'
                },
                {
                    type: 'input',
                    message: '请输入项目名称',
                    name: 'projName',
                    when: answer => answer.choosed
                }]);
            if (ans.choosed) {
                db.get('items').push({
                    name: ans.projName,
                    proxy: options.proxy
                }).write();
            }
        }
    }
    if (!options.debug) {
        const child = fork(
            path.resolve(__dirname, './server.js'),
            [ ...processArgvToFlags(pick(options, [ 'proxy', 'port', 'debug', 'copy' ])), '--from-bin=mycli-agent' ],
            {
                cwd: root,
                detached: true,
                stdio: [ null, null, null, 'ipc' ]
            });
        child.on('message', async ({ port, ip }) => {
            console.log(`
代理服务器已在 ${chalk.yellow(port)} 端口启动：
- 本地：${chalk.magenta(`http://localhost:${port}/proxy`)}
- 网络：${chalk.magenta(`http://${ip}:${port}/proxy`)}
路由映射至：${chalk.cyan(options.proxy)}`);
            child.unref();
            child.disconnect(); // 试验下，这行代码有必要加吗？
            process.exit(0);
        });
    } else {
        monitor(
            path.resolve(__dirname, './server.js'),
            processArgvToFlags(pick(options, [ 'proxy', 'port', 'debug', 'copy' ]))
        );
    }
};
