const fs = require('fs-extra');
const logger = require('../lib/logger');
const pMap = require('p-map');
const { db } = require('./util');
module.exports = async (args, options) => {
    const [ command, ...params ] = args;
    if (options && options.help) {
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

// 获取标记点展示位置
function getBuyInMark(data, percent) {
    data = data.map((item, index) => ({
        ...item,
        index,
        DWJZ: Number(item.DWJZ)
    }));
    let lastItem = data[0];
    const ret = [];
    for (let i = 1; i < data.length; i++) {
        const xn = data[i];
        const xn1 = data[i - 1];
        const xLast = lastItem;
        const xTop = data
            .filter(item => item.index >= xLast.index & item.index < xn.index)
            .reduce((maxItem, item) => {
                if (maxItem.DWJZ < item.DWJZ) {
                    return item;
                }
                return maxItem;
            }, { DWJZ: 0, FSRQ: data[0].FSRQ });
        if (xn.DWJZ >= xn1.DWJZ) {
            continue;
        }
        if ((xn.DWJZ - xTop.DWJZ) / xn.DWJZ > -percent / 100) {
            continue;
        }
        lastItem = xn;
        ret.push(xn);
    }
    return ret.map((item, index) => ({
        FSRQ: item.FSRQ,
        value: '加',
        xAxis: item.index,
        yAxis: item.DWJZ,
        itemStyle: {
            color: '#409eff'
        }
    }));
}
