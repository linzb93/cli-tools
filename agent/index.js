const chalk = require('chalk');
const clipboard = require('clipboardy');
const inquirer = require('inquirer');
const path = require('path');
const execa = require('execa');
const internalIp = require('internal-ip');
const { db } = require('./util');
const { processArgvToFlags } = require('../lib/util');
const { pick } = require('lodash');

module.exports = async (subCommand, options) => {
    if (subCommand === 'stop') {
        require('./stop')();
        return;
    }
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

    const args = [ path.resolve(__filename, './server.js'), ...processArgvToFlags(pick(options, [ 'proxy', 'port', 'debug' ])), '--from-bin=mycli' ];
    const child = execa('node', args, {
        cwd: path.resolve(__dirname, '../'),
        detached: true,
        stdio: [ null, null, null, 'ipc' ]
    });
    child.on('message', async ({ port }) => {
        console.log(port);
        const ip = await internalIp.v4();
        console.log(`
代理服务器已在 ${chalk.yellow(port)} 端口启动：
- 本地：${chalk.magenta(`http://localhost:${port}/proxy`)}
- 网络：${chalk.magenta(`http://${ip}:${port}/proxy`)}
路由映射至：${chalk.cyan(options.proxy)}`);
        if (options.copy) {
            clipboard.writeSync(`http://${ip}:${port}/proxy`);
        }
        child.unref();
        child.disconnect();
        process.exit(0);
    });
};
