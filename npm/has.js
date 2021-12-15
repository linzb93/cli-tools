const inquirer = require('inquirer');
const ora = require('ora');
const getNpmList = require('./_internal/getList');
const npm = require('./_internal/util');
module.exports = async (args, flag) => {
    const name = args[0];
    const spinner = ora('正在查找').start();
    const listRet = await getNpmList(name);
    if (!listRet.list.length) {
        handleNotFound(name, flag.dev);
        return;
    }
    if (listRet.list.length === 1) {
        spinner.succeed(`${name}存在，版本号是${listRet.versionList[0]}`);
        return;
    }
    spinner.succeed('发现有多个符合条件的依赖:');
    listRet.versionList.forEach(text => {
        console.log(`${text}`);
    });

    async function handleNotFound(name, dev) {
        spinner.stop();
        const { action } = await inquirer.prompt({
            type: 'confirm',
            name: 'action',
            message: `${name} 不存在，是否安装？`
        });
        if (action) {
            spinner.start(`正在安装${name}`);
            await npm.install(name, {
                dependencies: !dev,
                devDependencies: dev
            });
            spinner.succeed(`${name} 安装成功`);
        }
    }
};
