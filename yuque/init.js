const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');

module.exports = async () => {
  const {token, name} = await inquirer.prompt([
    {
      type: 'input',
      message: '请输入token',
      default: null,
      name: 'token'
    },
    {
      type: 'input',
      message: '请输入用户名',
      default: null,
      name: 'name'
    }
  ]);
  if (!token || !name) {
    return;
  }
  await fs.writeJSON(path.join(__dirname, 'yuque.config.json'), {token, name});
  console.log('配置成功');
}