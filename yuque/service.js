const axios = require('axios');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');

module.exports = async () => {
    const BASEURL = 'https://www.yuque.com/api/v2';
    let config;
    try {
        config = await fs.readJSON(path.join(__dirname, 'config.local.json'));
    } catch (e) {
        console.log('请先配置基础信息');
        config = await init();
    }
    const { token } = config;
    const service = axios.create({
        baseURL: BASEURL,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'local',
            'X-Auth-Token': token
        }
    });
    return service;
};

async function init() {
    const { token, name } = await inquirer.prompt([
        {
            type: 'input',
            message: '请输入token',
            default: null,
            name: 'token'
        },
        {
            type: 'input',
            message: '请输入用户名',
            default: null,
            name: 'name'
        }
    ]);
    if (!token || !name) {
        return;
    }
    await fs.writeJSON(path.join(__dirname, 'config.local.json'), { token, name });
    console.log('配置成功');
    return { token, name };
}
