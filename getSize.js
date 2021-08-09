const fs = require('fs-extra');
const bytes = require('bytes');
const axios = require('axios');
const path = require('path');
const {warn} = require('../lib/logger');
const del = require('del');
module.exports = async filePath => {
    let fileData;
    if (filePath.startsWith('http')) {
        let res;
        try {
            res = await axios.get(filePath, {
                responseType: 'stream'
            });
        } catch (e) {
            warn('文件地址不存在或无法正常下载');
        }
        const name = path.basename(filePath);
        const ws = fs.createWriteStream(name);
        res.data.pipe(ws);
        await new Promise(resolve => {
            ws.on('finish', () => {
                resolve();
            })
        });
        fileData = await fs.stat(name);
        const size = bytes(fileData.size);
        console.log(size);
        await del(name);
        return;
    }
    try {
        fileData = fs.stat(filePath);
    } catch (error) {
        warn(`文件${filePath}不存在或无法读取`);
    }
    console.log(bytes(fileData.size));
}