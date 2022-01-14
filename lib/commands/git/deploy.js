/**
 * 公司项目的代码部署到Jenkins测试环境与生产环境，默认测试环境
 * eg:
 * mycli git deploy 测试环境
 * mycli git deploy prod 生产环境
 */
const logger = require('../../util/logger');
const { validate } = require('../../util');
const inquirer = require('inquirer');
const git = require('../../util/git');
const gitTag = require('./tag');
const { sequenceExec } = require('../../util/pFunc');

module.exports = async (data, options) => {
    validate({
        data: data[0]
    }, {
        data: [{
            type: 'enum',
            enum: [ 'test', 'prod' ],
            message: '请输入正确的部署环境，测试环境可以不写，生产环境为prod'
        }]
    });
    const env = data[0];
    const newTag = env === 'prod' ? await gitTag({ silent: true }) : '';
    const curBranch = await git.getCurrentBranch();
    if (curBranch === 'release' && env === 'prod') {
        logger.warn('不能从release部署到生产环境，请切换回开发分支');
        return;
    }
    await sequenceExec([
        'git add .',
        `git commit -m ${options.commit || 'update'}`,
        'git pull',
        'git push',
        `git checkout ${env === 'prod' ? 'release' : 'master'}`,
        `git merge ${curBranch}`,
        'git pull',
        'git push',
        ...env === 'prod'
            ? [
                `git tag ${newTag}`,
                `git push origin ${newTag}`
            ]
            : [ `git checkout ${curBranch}` ]
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
    logger.success('操作成功');
};
