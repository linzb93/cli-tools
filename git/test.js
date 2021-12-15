const { command } = require('execa');
const git = require('./util');
const consola = require('consola');
const chalk = require('chalk');
const exec = async cmd => {
    console.log(`actions: ${chalk.yellow(cmd)}`);
    await command(cmd, { stdio: 'inherit' });
};
module.exports = async options => {
    const curBranch = await git.getCurrentBranch();
    try {
        await exec('git add .');
        await exec(`git commit -m ${options.commit || 'update'}`);
        await exec('git pull');
        await exec('git push');
        await exec('git checkout release');
        await exec(`git merge ${curBranch}`);
        await exec('git pull');
        await exec('git push');
        await exec(`git checkout ${curBranch}`);
    } catch (error) {
        consola.error(error);
        return;
    }
    consola.success('操作成功');
};
