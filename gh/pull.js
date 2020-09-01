const repository = `${process.env.HOME}/Documents/GitHub/node-demo`;
const simpleGit = require('simple-git/promise')(repository);
const {successLogger, errorLogger} = require('../lib/util');

module.exports = async () => {
  let ret;
  try {
    ret = await simpleGit.pull();
  } catch (e) {
    errorLogger(e);
  }
  successLogger('代码更新成功');
}