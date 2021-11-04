const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs-extra');
const npm = require('./_internal/util');
const shouldUseYarn = require('./_internal/shouldUseYarn');
module.exports = async (args, flag) => {
    const name = args[0];
    const dirs = await fs.readdir('node_modules');
    const spinner = ora('正在查找').start();
    let pkg;
    try {
        pkg = require(`${process.cwd()}/node_modules/${name}/package.json`);
    } catch (error) {
        handleNotFound(name, flag.dev);
        return;
    }
    const { version: currentVersion } = pkg;
    if (shouldUseYarn()) {
        spinner.succeed(`${name}存在，版本号是${pkg.version}`);
        return;
    }
    const matches = dirs.filter(dir => dir.startsWith(`_${name.startsWith('@') ? name.replace('/', '_') : name}@`));
    if (matches.length > 1) {
        const list = matches.map(item => {
            const version = getVersion(item);
            return `v${version}${version === currentVersion ? '（当前版本）' : ''}`;
        });
        spinner.succeed('发现有多个符合条件的依赖:');
        list.forEach(text => {
            console.log(`${text}`);
        });
    } else if (matches.length === 1) {
        spinner.succeed(`${name}存在，版本号是${pkg.version}`);
    }

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

function getVersion(packageName) {
    return packageName.match(/@([0-9a-z\-]+)@/)[1];
}
