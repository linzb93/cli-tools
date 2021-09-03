const open = require('open');
const {clidb} = require('./lib/db');
const logger = require('./lib/logger');
module.exports = async name => {
    const map = await clidb.get('openMap');
    if (map && map[name]) {
        open(map[name]);
    } else {
        logger.error('目录不存在，请重新输入');
    }
}