const execa = require('../../lib/exec');

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

module.exports = git;
