const fs = require('fs-extra');
const {successLogger, errorLogger} = require('../lib/util');

const repository = `${process.env.HOME}/Documents/GitHub/node-demo`;

module.exports = args => {
  const originFile = `${repository}/${args[0]}.js`;
  const dest = `${args[1]}.js`;
  try {
    fs.copyFile(originFile, dest);
  } catch (e) {
    errorLogger(e);
    return;
  }
  successLogger('代码复制成功');
}