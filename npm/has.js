const fs = require('fs-extra');
const inquirer = require('inquirer');
const ora = require('ora');
const npm = require('./_internal/util');
const logger = require('../lib/logger');

module.exports = async (args, flag) => {
  const name = args[0];
  try {
    await fs.access(`./node_modules/${name}`, fs.constants.F_OK);
  } catch (e) {
    handleNotFound(name, flag.dev);
    return;
  }
  logger.done(`${name} 存在`);
}

async function handleNotFound(name, dev) {
  const {action} = await inquirer.prompt({
    type: 'confirm',
    name: 'action',
    message: `${name} 不存在，是否安装？`
  });
  if (action) {
    const spinner = ora(`正在安装${name}`).start();
    await npm.install(name, {
        dependencies: !dev,
        devDependencies: dev
    });
    spinner.succeed(`${name} 安装成功`);
  }
}