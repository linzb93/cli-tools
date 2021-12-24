const OSS = require('ali-oss');
const { random } = require('lodash');
const clipboard = require('clipboardy');
const path = require('path');
const consola = require('consola');
const { clidb } = require('../util/db');

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
        consola.error('上传失败');
        return;
    }
    consola.success(`图片上传成功，地址是：
    ${url}`);
    clipboard.writeSync(url);
};
function getUploadFileName() {
    const timeStamp = `${random(Math.pow(10, 6), Math.pow(10, 6) * 2 - 1)}${new Date().getTime()}`;
    return `diankeduo/mdCdn/pic${timeStamp}`;
}
