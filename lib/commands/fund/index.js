const fs = require('fs-extra');
const path = require('path');
const db = require('./util/db');
const resolve = src => path.resolve(__dirname, src);
const pMap = require('p-map');
const { getFundInfo } = require('./api');

module.exports = async () => {
    /**
     * 1. 遍历所有的持仓，寻找打到补仓位和止盈位的基金
     * 2. 补仓是找当前价位和最近的最高价位相差达到某个值
     * 3. 设置输出方式，支持命令行输出或日志文件输出
     */
    const funds = await fs.readdir(resolve('./codes'));
    await pMap(funds, async fundFile => {
        const fund = fundFile.replace('.json', '');
        const res = await getFundInfo({ FCODE: fund });
        const lastestPrice = res.Datas.slice(-1).split(',').slice(-1)[0];
    });
};

function needCover(code, lastestPrice) {
    const { history, baseInfo } = db.fund.get(code);
    for (let i = history.length - 1; i >= 0; i--) {
        if ((lastestPrice - history[i].price) / history[i].price * 100 < baseInfo.coverRate) {
            // 补仓
        }
    }
}

function needSale(code, lastestPrice) {
    const { history, baseInfo } = db.fund.get(code);
    if (baseInfo.currentRate + (lastestPrice - history.slice(-1)[0].price) / history.slice(-1)[0].price * 100 >= baseInfo.saleRate) {
        // 止盈
    }
}
