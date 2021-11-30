const fs = require('fs-extra');
const logger = require('../lib/logger');
const pMap = require('p-map');
const { db } = require('./util');
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
        const ret = [];
        await pMap(params, async fund => {
            const { detail } = db.fund.get(fund);
            ret.push(detail.SHORTNAME);
            await fs.unlink(`fund/data/${fund}.json`);
        });
        if (ret.length > 1) {
            logger.done(`以下基金已被移除：
            ${ret.join('\n')}`);
        } else {
            logger.done(`基金"${ret[0]}"已被移除`);
        }
    }
    if (command === 'set') {
        require('./set')(params);
    }
    if (command === 'buy') {
        // 买入
        require('./buy')(params);
    }
    if (command === 'sale') {
        // 卖出
        require('./sale')(params);
    }
    if (!command) {
        // 查询收益，提醒补仓与卖出
        const dirs = await fs.readdir('fund/data');
        if (!dirs.length) {
            return;
        }
    }
};
