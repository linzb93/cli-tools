const axios = require('axios');
const fs = require('fs-extra');
const moment = require('moment');
const path = require('path');
const { errorLogger } = require('../lib/util');

module.exports = async args => {
    const BASEURL = 'https://www.yuque.com/api/v2';
    let config;
    try {
        config = await fs.readJSON(path.join(__dirname, 'config.local.json'));
    } catch (e) {
        console.log('请先配置基础信息');
        return;
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

    try {
        await service.post(`/repos/linzb93/notes/docs`, {
            title: `memo ${moment().format('YYYY-MM-DD h:mm:ss a')}`,
            body: args[0]
        });
    } catch (error) {
        errorLogger(error.response.data);
        return;   
    }
    console.log('推送成功');
    // await service.put(`/repos/diary/docs/12703595`)
}