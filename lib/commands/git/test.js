const consola = require('consola');
const inquirer = require('inquirer');
const git = require('../../util/git');
const { sequenceExec } = require('../../util/pFunc');

module.exports = async (data, options) => {
    const curBranch = await git.getCurrentBranch();
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
    ], {
        async failCallback() {
            const ans = await inquirer.prompt([{
                message: '代码合并失败，检测到代码有冲突，是否已解决？',
                type: 'confirm',
                default: true,
                name: 'resolved'
            }]);
            if (!ans.resolved) {
                throw new Error('exit');
            }
            await sequenceExec([
                'git add .',
                'git commit -m conflict-fixed'
            ]);
            return ans.resolved;
        }
    });
    consola.success('操作成功');
};
