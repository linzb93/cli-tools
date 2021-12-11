const fs = require('fs-extra');
const bytes = require('bytes');
const axios = require('axios');
const path = require('path');
const logger = require('./lib/logger');
const del = require('del');
module.exports = async filePath => {
    let fileData;
    if (filePath.startsWith('http')) {
        let res;
        filePath = filePath.replace(/\s/g, ',');
        try {
            res = await axios.get(filePath, {
                responseType: 'stream'
            });
        } catch (e) {
            logger.error('文件地址不存在或无法正常下载');
        }
        const filename = getFileName(filePath);
        const ws = fs.createWriteStream(filename);
        res.data.pipe(ws);
        await new Promise(resolve => {
            ws.on('finish', resolve);
        });
        fileData = await fs.stat(filename);
        console.log(bytes(fileData.size));
        await del(filename);
        return;
    }
    try {
        fileData = await fs.stat(filePath);
    } catch (error) {
        logger.error(`文件${filePath}不存在或无法读取`);
        return;
    }
    console.log(bytes(fileData.size));
};

function getFileName(src) {
    const realSrc = src.split('?')[0];
    return path.basename(realSrc);
}
