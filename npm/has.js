const fs = require('fs-extra');
const inquirer = require('inquirer');
const ora = require('ora');
const execa = require('execa');
const {successLogger} = require('../lib/util');

module.exports = async args => {
  const name = args[0];
  try {
    await fs.access(`./node_modules/${name}`, fs.constants.F_OK);
  } catch (e) {
    handleNotFound(name);
    return;
  }
  successLogger(`${name} 存在`);
}

async function handleNotFound(name) {
  const {action} = await inquirer.prompt({
    type: 'confirm',
    name: 'action',
    message: `${name} 不存在，是否安装？`
  });
  if (action) {
    const spinner = ora(`正在安装${name}`).start();
    try {
      await execa('cnpm', ['i', name, '-S']);
    } catch (e) {
      spinner.fail(`${name} 无法下载，请检查拼写是否有误。`);
      return;
    }
    spinner.succeed(`${name} 安装成功`);
  }
}