const fs = require('fs-extra');
const bytes = require('bytes');
const axios = require('axios');
const consola = require('consola');
const getStream = require('get-stream');
module.exports = async filePath => {
    let fileData;
    if (filePath.startsWith('http')) {
        let res;
        // 当filePath外面不加引号时，地址里面的逗号会被解析成空格，所以下面这段代码是要还原回去
        filePath = filePath.replace(/\s/g, ',');
        try {
            res = await axios.get(filePath, {
                responseType: 'stream'
            });
        } catch (e) {
            consola.error('文件地址不存在或无法正常下载');
            return;
        }
        console.log(bytes((await getStream.buffer(res.data)).length));
        return;
    }
    try {
        fileData = await fs.stat(filePath);
    } catch (error) {
        consola.error(`文件${filePath}不存在或无法读取`);
        return;
    }
    console.log(bytes(fileData.size));
};
