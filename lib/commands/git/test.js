const git = require('../../util/git');
const { sequenceExec } = require('../../util');
const consola = require('consola');

module.exports = async (data, options) => {
    const curBranch = await git.getCurrentBranch();
    try {
        await sequenceExec([
            'git add .',
            `git commit -m ${options.commit || 'update'}`,
            ...options.notSync ? [] : [
                'git pull',
                'git push'
            ],
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
