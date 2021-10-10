const inquirer = require('inquirer');
const ora = require('ora');
const npm = require('./_internal/util');
const logger = require('../lib/logger');

module.exports = async (args, flag) => {
    const name = args[0];
    let pkg;
    try {
        pkg = require(`${process.cwd()}/node_modules/${name}/package.json`);
    } catch (e) {
        handleNotFound(name, flag.dev);
        return;
    }
    if (!flag.version) {
        logger.done(`${name} 存在`);
    } else {
        logger.done(`${name} 版本号是 ${pkg.version}`);
    }
};

async function handleNotFound(name, dev) {
    const { action } = await inquirer.prompt({
        type: 'confirm',
        name: 'action',
        message: `${name} 不存在，是否安装？`
    });
    if (action) {
        const spinner = ora(`正在安装${name}`).start();
        await npm.install(name, {
            dependencies: !dev,
            devDependencies: dev
        });
        spinner.succeed(`${name} 安装成功`);
    }
}
