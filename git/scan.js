// 扫描所有工作项目文件夹，有未提交、推送的git就提醒。
const git = require('./_internal/git');
const execa = require('../lib/exec');
module.exports = async () => {
    const data = await execa('git status -b');
    console.log(data.stdout);
};
