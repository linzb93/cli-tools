const fs = require('fs-extra');
const logger = require('../lib/logger');
const pMap = require('p-map');
module.exports = async (args, options) => {
    const [ command, ...params ] = args;
    if (options.help) {
        require('./help')();
        return;
    }
    if (command === 'add') {
        require('./add')(params);
        return;
    }
    if (command === 'remove') {
        await pMap(params, async fund => {
            await fs.unlink(`fund/data/${fund}.json`);
            logger.done(`${fund}移除成功`);
        });
    }
    if (command === 'buy') {
        // 买入
    }
    if (command === 'sale') {
        // 卖出
    }
    if (!command) {
        // 查询收益，提醒补仓与卖出
        const dirs = await fs.readdir('fund/data');
        if (!dirs.length) {
            return;
        }
    }
};
