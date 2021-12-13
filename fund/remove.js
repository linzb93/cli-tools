const pMap = require('p-map');
const fs = require('fs-extra');
const { db } = require('./util');
const consola = require('consola');

module.exports = async funds => {
    if (!funds.length) {
        consola.error('请输入基金代码，中间用空格分隔');
        return;
    }
    const ret = [];
    await pMap(funds, async fund => {
        if (!/[0-9]{6}/.test(fund)) {
            throw new Error('请输入6位数基金代码');
        }
        const { detail } = db.fund.get(fund);
        ret.push(detail.SHORTNAME);
        await fs.unlink(`fund/data/${fund}.json`);
    });
    if (ret.length > 1) {
        consola.success(`以下基金已被移除：
            ${ret.join('\n')}`);
    } else {
        consola.success(`基金"${ret[0]}"已被移除`);
    }
};
