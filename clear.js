const fs = require('fs-extra');
const globby = require('globby');
const pMap = require('p-map');
const logger = require('./lib/logger');
module.exports = async filename => {
    const paths = await globby([filename, `**/*/${filename}`, '!node_modules']);
    const len = paths.length;
    if (len === 0) {
        logger.done('未发现需要删除的文件');
        return;
    }
    await pMap(files, async file => {
        return fs.unlink(file);
    }, {concurrency: 10});
    logger.done(`操作成功，共发现${len}个文件`);
}