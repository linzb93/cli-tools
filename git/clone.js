const path = require('path');
const ora = require('ora');
const npmPage = require('../npm/_internal/npmPage');
const git = require('./_internal/git');
const {clidb} = require('../lib/db');
const {openInEditor} = require('../lib/util');
const logger = require('../lib/logger');
const {isURL} = require('../lib/util');
// TODO:commander是V7+，检查下是不是版本不对
module.exports = async (param, cmd) => {
    const package = Array.isArray(param) ? param[0] : param;
    let spinner = ora(`正在下载`);
    let dirName;
    if (isGitUrl(package)) {
        const openMap = await clidb.get('openMap');
        if (!openMap[cmd.dir]) {
            logger.error('目标文件夹不存在');
            return;
        }
        const url = toGitUrl(package);
        spinner.start();
        try {
            dirName = await git.clone({
                url,
                cwd: openMap[cmd.dir]
            });
        } catch (error) {
            spinner.fail('下载失败');
            console.log(error.message);
            return;
        }
        spinner.succeed('下载成功');
        if (cmd.open) {
            await openInEditor(path.resolve(openMap[cmd.dir], dirName));
        }
        return;
    }
    let page;
    try {
        page = await npmPage(package);
    } catch (error) {
        logger.error(error);
        return;
    }
    const repo = page.get('repository');
    spinner.start();
    const cwd = clidb.get('sourceCodeDir');
    try {
        dirName = await git.clone({
            url: `${repo}.git`,
            shallow: true,
            cwd
        });
    } catch (error) {
        spinner.fail('下载失败');
        console.log(error.message);
        return;
    }
    spinner.succeed('下载成功');
    await openInEditor(path.resolve(cwd, dirName));
}

function isGitUrl(url) {
    return (isURL(url) && url.endsWith('.git')) || isGitSSH(url);
}
function isGitSSH(url) {
    return url.startsWith('git@') && url.endsWith('.git');
}
function toGitUrl(url) {
    if (isURL(url) && url.endsWith('.git')) {
        return url;
    }
    return url
    .replace(/git@([a-z\.]+\.com)\:/, 'https://$1/');
}