const axios = require('axios');
const fs = require('fs-extra');
const moment = require('moment');
const cheerio = require('cheerio');
const path = require('path');
const { errorLogger, isURL } = require('../lib/util');

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

    let title = `memo ${moment().format('YYYY-MM-DD h:mm:ss a')}`;
    let body = args[0];
    if (isURL(body)) {
        const {data: html} = await service.get(body);
        const $ = cheerio.load(html);
        title = $('title').text();
    }

    try {
        await service.post(`/repos/linzb93/notes/docs`, {
            title,
            body
        });
    } catch (error) {
        errorLogger(error.response.data);
        return;   
    }
    console.log('推送成功');
}