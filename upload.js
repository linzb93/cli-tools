const OSS = require('ali-oss');
const { clidb } = require('./lib/db');
const { random } = require('lodash');
const logger = require('./lib/logger');
const clipboard = require('clipboardy');
const path = require('path');
module.exports = async pic => {
    const ossConfig = clidb.get('oss');
    const oss = new OSS({
        ...ossConfig,
        timeout: 15000
    });
    let url = '';
    try {
        const res = await oss.put(`${getUploadFileName()}${path.extname(pic)}`, pic);
        url = `https://oss.fjdaze.com/${res.name}`;
    } catch (error) {
        logger.error('上传失败');
        return;
    }
    logger.done(`图片上传成功，地址是：
    ${url}`);
    clipboard.writeSync(url);
};
function getUploadFileName() {
    const timeStamp = `${random(Math.pow(10, 6), Math.pow(10, 6) * 2 - 1)}${new Date().getTime()}`;
    return `diankeduo/mdCdn/pic${timeStamp}`;
}
