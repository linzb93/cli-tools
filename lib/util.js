const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

exports.errorLogger = function errorLogger(text) {
  console.log(chalk.red(text));
}

exports.successLogger = function successLogger(text) {
  console.log(chalk.green(text));
}

exports.warnLogger = function warnLogger(text) {
  console.log(chalk.yellow(text));
}

exports.moduleInit = async function(dirname, args, flag) {
  let flagMap;
  try {
    flagMap = await fs.readJSON(path.join(dirname, 'command.json'));
  } catch (e) {
    errorLogger(e);
  }
  const basename = dirname.split('/').pop();
  const matches = flagMap.filter(item => item.alias === flag);
  if (matches.length) {
    require(path.join(dirname, `${matches[0].id}`))(args);
  } else {
    console.log(chalk.red(`
alias输入有误，请重新输入!
${chalk.yellow(flagMap.map(type => `mycli ${basename} -${type.alias}: ${type.name}${type.extra ? ` ${type.extra}`: ''}`).join('\n'))}`));
  }
}