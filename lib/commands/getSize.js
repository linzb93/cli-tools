const fs = require('fs-extra');
const bytes = require('bytes');
const axios = require('axios');
const { isURL } = require('../util');
const logger = require('../util/logger');
module.exports = async filePath => {
    let fileData;
    if (isURL(filePath)) {
        let res;
        // 当filePath外面不加引号时，地址里面的逗号会被解析成空格，所以下面这段代码是要把地址还原回去
        filePath = filePath.replace(/\s/g, ',');
        try {
            res = await axios.get(filePath, {
                responseType: 'stream'
            });
        } catch (e) {
            logger.error('文件地址不存在或无法正常下载');
            return;
        }
        logger.success(bytes((await getSize(res.data))));
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

async function getSize(inputStream) {
    let len = 0;
    return new Promise(resolve => {
        inputStream.on('data', str => {
            len += str.length;
        });
        inputStream.on('end', () => {
            resolve(len);
        });
    });
}
