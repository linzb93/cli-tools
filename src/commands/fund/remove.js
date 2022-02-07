const fs = require('fs-extra');
const db = require('./util/db');
const logger = require('../../util/logger');

module.exports = async (funds) => {
  if (!funds.length) {
    logger.error('请输入基金代码，中间用空格分隔');
    return;
  }
  const ret = [];
  for (const fund of funds) {
    if (!/[0-9]{6}/.test(fund)) {
      throw new Error('请输入6位数基金代码');
    }
    const { detail } = db.fund.get(fund);
    ret.push(detail.SHORTNAME);
    await fs.unlink(`fund/data/${fund}.json`);
  }
  if (ret.length > 1) {
    logger.success(`以下基金已被移除：
            ${ret.join('\n')}`);
  } else {
    logger.success(`基金"${ret[0]}"已被移除`);
  }
};
