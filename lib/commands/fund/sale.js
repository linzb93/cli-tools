const consola = require('consola');
const db = require('./util/db');
module.exports = async ([ code, shares ]) => {
    const data = db.fund.get(code);
    const rawShares = data.baseInfo.shares;
    let newShares;
    if (shares === '*') {
        // 清仓
        newShares = 0;
    } else if (!isNaN(Number(shares))) {
        // 数字
        newShares = rawShares - shares;
    } else if (isPosPercent(shares)) {
        // 百分比
        newShares = rawShares * transPercent(shares);
    } else if (isFraction(shares)) {
        // 分数
        newShares = rawShares * transFraction(shares);
    } else {
        consola.error('输入份额格式不合法');
        return;
    }
    db.fund.updateInfo({
        shares: newShares
    });
    console.log(`基金${data.baseInfo.name}已减仓，当前份额为${newShares}`);
};

// 正百分数
function isPosPercent(value) {
    if (!value.endsWith(value)) {
        return false;
    }
    const preData = value.slice(0, -1);
    return !isNaN(Number(preData)) && Number(preData) > 0;
}
function transPercent(value) {
    const preData = value.slice(0, -1);
    return Number((Number(preData) / 100).toFixed(2));
}
function isFraction(value) {
    if (!value.includes('/')) {
        return false;
    }
    const seg = value.split('/');
    if (seg.some(data => isNaN(Number(data)) || Number(data) <= 0)) {
        return false;
    }
    return seg.every(data => data !== '0');
}
function transFraction(value) {
    const seg = value.split('/');
    return Number((seg[0] / seg[1]).toFixed(2));
}
