const path = require('path');
const ora = require('ora');
const fs = require('fs-extra');
const npmPage = require('../npm/_internal/npmPage');
const git = require('./util');
const { clidb } = require('../lib/db');
const { openInEditor } = require('../lib/util');
const consola = require('consola');
const { isURL } = require('../lib/util');

module.exports = async (param, options) => {
    const package = Array.isArray(param) ? param[0] : param;
    const spinner = ora('正在下载');
    let dirName;
    if (isGitUrl(package)) {
        const openMap = await clidb.get('open');
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
        consola.error(error);
        return;
    }
    const repo = page.get('repository');
    spinner.start();
    const cwd = clidb.get('open.source');
    if (await fs.pathExists(path.join(cwd, path.basename(repo)))) {
        spinner.text = '正在拉取最新代码';
        await git.pull({
            cwd: path.join(cwd, path.basename(repo))
        });
        spinner.succeed('下载成功');
        if (options.open) {
            await openInEditor(path.resolve(cwd, path.basename(repo)));
        }
        return;
    }
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
    if (options.open) {
        await openInEditor(path.resolve(cwd, dirName));
    }
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
