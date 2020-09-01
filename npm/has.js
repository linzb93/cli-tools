const fs = require('fs-extra');
const {successLogger, errorLogger} = require('../lib/util');

module.exports = async args => {
  let exists = await fs.exists(`./node_modules/${args[0]}`);
  if (exists) {
    successLogger(`${args[0]} 存在`);
  } else {
    errorLogger(`${args[0]} 不存在`);
  }
}