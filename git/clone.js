const path = require('path');
const ora = require('ora');
const npmPage = require('../npm/_internal/npmPage');
const git = require('./_internal/git');
const {clidb} = require('../lib/db');
const execa = require('../lib/exec');

module.exports = async package => {
    const spinner = ora(`正在获取${package}的仓库地址`).start();
    const page = await npmPage(package);
    const repo = page.get('repository');
    spinner.text = `已获取到${package}的仓库地址，正在clone...`;
    const cwd = clidb.get('sourceCodeDir');
    let dirName;
    try {
        dirName = await git.clone({
            url: `${repo}.git`,
            shallow: true,
            cwd
        });
    } catch (error) {
        spinner.fail('下载失败');
        console.log(error.message);
        return;
    }
    spinner.succeed('下载成功');
    execa(`code ${path.resolve(cwd, dirName)}`);
}