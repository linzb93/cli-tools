const fs = require('fs-extra');
const path = require('path');
const db = require('./util/db');
const resolve = (src) => path.resolve(__dirname, src);
const pMap = require('p-map');
const { getFundInfo } = require('./api');

module.exports = async ({ renderer = console }) => {
  /**
   * 1. 遍历所有的持仓，寻找打到补仓位和止盈位的基金
   * 2. 补仓是找当前价位和最近的最高价位相差达到某个值
   * 3. 设置输出方式，支持命令行输出或日志文件输出
   */
  const funds = await fs.readdir(resolve('./codes'));
  await pMap(
    funds,
    async (fundFile) => {
      const fund = fundFile.replace('.json', '');
      const res = await getFundInfo({ FCODE: fund });
      const data = db.fund.get(fund);
      const lastestPrice = res.Datas.slice(-1).split(',').slice(-1)[0];
      if (needCover(data, lastestPrice)) {
        output(
          `【${data.baseInfo.name}】今日收益率${
            ((lastestPrice - data.history.slice(-1)[0].price) /
              data.history.slice(-1)[0].price) *
            100
          }%，可以补仓`,
          renderer
        );
      } else if (needSale(data, lastestPrice)) {
        output(
          `【${data.baseInfo.name}】目前收益率${
            data.baseInfo.currentRate
          }%，今日收益率${
            ((lastestPrice - data.history.slice(-1)[0].price) /
              data.history.slice(-1)[0].price) *
            100
          }%，可以补仓`,
          renderer
        );
      }
    },
    { concurrency: 3 }
  );
};

function needCover(data, lastestPrice) {
  const { history, baseInfo } = data;
  for (let i = history.length - 1; i >= 0; i--) {
    if (
      ((lastestPrice - history[i].price) / history[i].price) * 100 <
      baseInfo.coverRate
    ) {
      return true;
    }
  }
  return false;
}

function needSale(data, lastestPrice) {
  const { history, baseInfo } = data;
  if (
    baseInfo.currentRate +
      ((lastestPrice - history.slice(-1)[0].price) /
        history.slice(-1)[0].price) *
        100 >=
    baseInfo.saleRate
  ) {
    return true;
  }
  return false;
}

function output(text, renderer) {
  typeof renderer.log === 'function' && renderer.log(text);
}
