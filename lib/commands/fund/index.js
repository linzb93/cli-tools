const fs = require('fs-extra');

module.exports = async (args, options) => {
    /**
     * 1. 遍历所有的持仓，寻找打到补仓位和止盈位的基金
     * 2. 补仓是找当前价位和最近的最高价位相差达到某个值
     * 3. 设置输出方式，支持命令行输出或日志文件输出
     */
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
