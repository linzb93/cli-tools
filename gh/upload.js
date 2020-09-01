const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');
const {successLogger, errorLogger, warnLogger} = require('../lib/util');

const repository = `${process.env.HOME}/Documents/GitHub/node-demo`;

module.exports = async args => {
  /**
   * 遍历目录，直到目标文件
   * 或者新建文件夹，直到新建目标文件
   */
  const originFile = `${args[0]}.js`;
  // 检查原始文件是否存在
  const originFileExists = await fs.pathExists(`${args[0]}.js`);
  if (!originFileExists) {
    errorLogger('源文件不存在');
    return;
  }
  
  let destFile = '';
  let destPath = repository;
  let finished = false; // 是否写入操作已完成，已完成的话循环结束不需要再写入
  while(path.extname(destFile) !== '.js') {
    // 获取仓库列表
    let dirList;
    try {
      dirList = await fs.readdir(destPath);
    } catch (e) {
      errorLogger(e);
      return;
    }
    dirList = dirList.filter(dir => !dir.startsWith('.'))
    const answer = await inquirer.prompt([{
      type: 'list',
      name: 'destFile',
      message: '请选择文件夹，或者新建文件夹',
      choices: dirList.concat(['新建文件', '新建文件夹'])
    }]);
    destFile = answer.destFile;
    if (destFile === '新建文件夹') {
      const {answer} = await inquirer.prompt([{
        type: 'input',
        name: 'answer',
        message: '请输入文件夹名称并进入'
      }]);
      if (answer.trim() === '') {
        errorLogger('文件夹名称不能为空');
        return;
      }
      if (dirList.includes(answer)) {
        errorLogger('文件夹已存在，新建失败');
        return;
      }
      destPath += `/${answer}`;
      await fs.mkdir(destPath);
      successLogger(`文件夹 ${answer} 创建成功`);
    } else if (destFile === '新建文件') {
      const {answer} = await inquirer.prompt([{
        type: 'input',
        name: 'answer',
        message: '请输入文件名称并拷贝'
      }]);
      if (answer.trim() === '') {
        errorLogger('文件名称不能为空');
        return;
      }
      if (dirList.includes(`${answer}.js`)) {
        errorLogger('文件名已存在，新建失败');
        return;
      }
      await fs.copyFile(originFile, `${destPath}/${answer}.js`);
      destFile = `${answer}.js`;
      successLogger(`文件 ${destPath}/${destFile} 已创建`);
      finished = true;
    } else {
      destPath += `/${destFile}`;
    }
  }
  if (!finished) {
    await fs.copyFile(originFile, `${destPath}`);
    successLogger(`文件 ${destPath} 已更新`);
  }
}