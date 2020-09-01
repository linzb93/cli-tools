const axios = require('axios');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const pSeries = require('p-series');
const ora = require('ora');
const path = require('path');

module.exports = async () => {
  const BASEURL = 'https://www.yuque.com/api/v2';
  let config;
  try {
    config = await fs.readJSON(path.join(__dirname, 'yuque.config.json'));
  } catch (e) {
    console.log('请先配置基础信息');
    return;
  }
  const {token, name} = config;
  const {fileName} = await inquirer.prompt([{
    type: 'input',
    message: '请选择上传的文件（默认上传全部文件）',
    name: 'fileName',
    default: ''
  }]);
  const service = axios.create({
    baseURL: BASEURL,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'local',
      'X-Auth-Token': token
    }
  });
  let repos;
  try {
    repos = await service.get(`/users/${name}/repos`);
  } catch(e) {
    console.log(e);
    return;
  }
  let reposData = repos.data.data;
  const {repo} = await inquirer.prompt([{
    type: 'list',
    message: '请选择知识库',
    name: 'repo',
    choices: reposData.map(item => item.name)
  }]);
  const match = reposData.filter(item => item.name === repo)[0];
  if (fileName !== '') {
    let text;
    try {
      text = await fs.readFile(fileName, 'utf8');
    } catch (e) {
      console.log(`${fileName} 文件不存在！`);
      return;
    }
    let newText = text.split('\n').slice(2).join('\n');
    try {
      await service.post(`/repos/${match.namespace}/docs`, {
        title: fileName.replace('.md', ' 日记'),
        public: 0,
        body: newText
      });
    } catch (e) {
      console.log(e.response.data);
      return;
    }
    console.log('上传成功');
  } else {
    let spinner = ora(`正在上传文件`).start();
    const files = await fs.readdir('./');
    const tasks = files.map(file => async () => {
      if (path.extname(file) !== '.md') {
        return;
      }
      const text = await fs.readFile(file, 'utf8');
      const newText = text.split('\n').slice(2).join('\n');
      return service.post(`/repos/${match.namespace}/docs`, {
        title: file.replace('.md', ' 日记'),
        public: 0,
        body: newText
      })
    });
    try {
      await pSeries(tasks);
    } catch (e) {
      spinner.fail('上传失败');
      console.log(e);
      return;
    }
    spinner.succeed('上传成功');
  }
};