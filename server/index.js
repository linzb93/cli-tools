const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('../lib/logger');
const getPort = require('detect-port');
const os = require('os');
const chalk = require('chalk');
const clipboard = require('clipboardy');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');
const resolve = src => path.resolve(__dirname, src);

module.exports = async options => {
    const cacheData = await fs.readJSON(resolve('cache.json'));
    const match = cacheData.find(item => item.proxy === options.proxy);
    if (!match) {
        if (!options.proxy) {
            const { server } = await inquirer.prompt([{
                message: '请选择要开启的代理服务器',
                type: 'list',
                choices: cacheData.map(data => ({
                    name: data.name,
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
                    name: 'choice'
                },
                {
                    type: 'input',
                    message: '请输入项目名称',
                    name: 'projName',
                    when: answer => answer.choice
                }]);
            cacheData.push({
                name: ans.projName,
                proxy: options.proxy
            });
            await fs.writeJSON(resolve('cache.json'), cacheData);
        }
    }
    const app = express();
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(cors());
    app.all('/proxy/*', (req, res) => {
        const url = req.url.replace('/proxy', '');
        axios({
            method: req.method,
            url: `${options.proxy}${url}`,
            data: req.body,
            headers: {
                token: req.headers.token
            }
        })
            .then(resp => {
                res.send(resp.data);
            })
            .catch(e => {
                if (!e.response) {
                    logger.error(e.stack, true);
                }
                const status = e.response ? e.response.status : 500;
                res.status(status).send(e.response || {
                    message: e.message
                });
            });
    });
    const port = await getPort(options.port || 8080);
    const ip = os.networkInterfaces()['以太网'][1].address;
    app.listen(port, () => {
        console.log(`
代理服务器已在${chalk.yellow(port)}端口启动：
- 本地：${chalk.magenta(`http://localhost:${port}/proxy`)}
- 网络：${chalk.magenta(`http://${ip}:${port}/proxy`)}
路由映射至：${chalk.cyan(options.proxy)}`);
        if (options.copy) {
            clipboard.writeSync(`http://${ip}:${port}/proxy`);
        }
    });
};
