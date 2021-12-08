const path = require('path');
const ora = require('ora');
const npmPage = require('../npm/_internal/npmPage');
const git = require('./_internal/git');
const { clidb } = require('../lib/db');
const { openInEditor } = require('../lib/util');
const logger = require('../lib/logger');
const { isURL } = require('../lib/util');

module.exports = async (param, options) => {
    const package = Array.isArray(param) ? param[0] : param;
    const spinner = ora('正在下载');
    let dirName;
    if (isGitUrl(package)) {
        const openMap = await clidb.get('openMap');
        if (!openMap[options.dir]) {
            options.dir = 'source';
        }
        const url = toGitUrl(package);
        spinner.start();
        try {
            dirName = await git.clone({
                url,
                dirName: path.basename(url, '.git'),
                cwd: openMap[options.dir]
            });
        } catch (error) {
            spinner.fail(`下载失败:
            ${error.message}`);
            return;
        }
        spinner.succeed('下载成功');
        if (options.open) {
            await openInEditor(path.resolve(openMap[options.dir], dirName));
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
};

function isGitUrl(url) {
    return isURL(url) || isGitSSH(url);
}
function isGitSSH(url) {
    return url.startsWith('git@') && url.endsWith('.git');
}
function toGitUrl(url) {
    if (isURL(url)) {
        return url.endsWith('.git') ? url : `${url}.git`;
    }
    return url
        .replace(/git@([a-z\.]+\.com)\:/, 'https://$1/')
        .replace(/[^\.git]$/, '.git');
}
