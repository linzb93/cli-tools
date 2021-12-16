const git = require('./util');
const { sequenceExec } = require('../lib/util');
const consola = require('consola');

module.exports = async (data, options) => {
    const curBranch = await git.getCurrentBranch();
    try {
        await sequenceExec([
            'git add .',
            `git commit -m ${options.commit || 'update'}`,
            'git pull',
            'git push',
            'git checkout release',
            `git merge ${curBranch}`,
            'git pull',
            'git push',
            `git checkout ${curBranch}`
        ]);
    } catch (error) {
        consola.error(error);
        return;
    }
    consola.success('操作成功');
};
