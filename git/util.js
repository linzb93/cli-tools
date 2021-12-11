const { command: execa } = require('execa');
const git = async () => {
    await execa('git add .');
    await execa('git commit -m update');
};
git.isGit = async ({ cwd = process.cwd() }) => {
    try {
        await execa('git rev-parse --is-inside-work-tree', {
            cwd
        });
        return true;
    } catch (error) {
        return false;
    }
};
git.clone = async ({
    url,
    branch,
    dirName,
    shallow = false,
    cwd = process.cwd()
}) => {
    await execa(`git clone${branch ? ` -b ${branch}` : ''} ${url}${dirName ? ` ${dirName}` : ''}${shallow ? ' --depth=1' : ''}`, {
        cwd
    });
    return dirName || url.split('/').slice(-1)[0].slice(0, -4);
};
git.remote = async () => {
    const { stdout: data } = await execa('git remote -v');
    return data.split('\n')[0].match(/http.+\.git/)[0];
};
// 获取代码提交状态，分为未提交 1；未推送 2；已推送 3；不在master分支上 4；状态未知 0
git.getPushStatus = async ({ cwd }) => {
    // if (!await git.isGit()) {
    //     return 0;
    // }
    let stdout = '';
    try {
        const data = await execa('git status', {
            cwd
        });
        stdout = data.stdout;
    } catch (error) {
        return 0;
    }
    if (stdout.includes('Changes not staged for commit') || stdout.includes('Changes to be committed')) {
        return 1;
    }
    if (stdout.includes('Your branch is ahead of ')) {
        return 2;
    }
    if (stdout.match(/On branch (\S+)/)[1] !== 'master') {
        return 4;
    }
    if (stdout.includes('nothing to commit')) {
        return 3;
    }
    return 0;
};
git.branch = async () => {
    const { stdout: data } = await execa('git branch --list');
    return data.split('\n').map(line => line.replace('*', '').trim());
};

module.exports = git;
