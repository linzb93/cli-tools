const execa = require('../../lib/exec');
const pEvery = require('p-every');
const git = async () => {
    await execa('git add .');
    await execa('git commit -m update');
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
git.hasUncommited = async () => {
    const { stdout: data } = await execa('git status --short');
    return data === '';
};
git.hasUnPushed = async isOnlyCurrentBranch => {
    // 根据输出内容是否包含“origin/”判断是否有commit未推送
    if (isOnlyCurrentBranch) {
        const { stdout: data } = await execa('git log -1 --oneline');
        return !data.includes('origin/');
    }
    const branchs = await git.branch();
    const ret = await pEvery(branchs, async branch => {
        const { stdout: data } = await execa(`git log ${branch} -1 --oneline`);
        console.log(data);
        return data.includes('origin/');
    });
    return !ret;
};
git.branch = async () => {
    const { stdout: data } = await execa('git branch --list');
    return data.split('\n').map(line => line.replace('*', '').trim());
};

module.exports = git;
