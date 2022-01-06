const consola = require('consola');
const db = require('./util/db');

module.exports = async ([ code, moneyParams ]) => {
    const money = Number(moneyParams);
    if (isNaN(money) || !Number.isInteger(money) || money < 10) {
        consola.error('请输入大于10的正整数');
        return;
    }
    const data = db.fund.get(code);
    const share = Number((money / data.lastestPrice).toFixed(2));
    data.baseInfo.share += share;
    db.fund.updateInfo(code, {
        share: data.baseInfo.share
    });
    consola.success(`成功购买基金“${data.baseInfo.name}”${share}股`);
};
