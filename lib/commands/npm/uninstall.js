const consola = require('consola');
const inquirer = require('inquirer');
const pMap = require('p-map');
const del = require('del');
const path = require('path');
const getNpmList = require('./_internal/getList');
const readPkg = require('read-pkg');
const { getVersion } = getNpmList;
const globalNpm = require('global-modules');

module.exports = async (args, options) => {
    const name = args[0];
    if (options.global) {
        await delGlobal(name);
        consola.success('删除成功');
        return;
    }
    const listRet = await getNpmList(name);
    if (!listRet.list.length) {
        consola.error('没找到，无法删除');
        return;
    }
    if (listRet.list.length === 1) {
        await del(`node_modules/${listRet.list[0]}`);
        consola.success('删除成功');
        return;
    }
    const ans = await inquirer.prompt([{
        message: '发现有多个符合条件的依赖，请选择其中需要删除的',
        type: 'checkbox',
        name: 'ret',
        choices: listRet.list.map(item => ({
            name: getVersion(item),
            value: item
        }))
    }]);
    try {
        await pMap(ans.ret, async pkg => {
            await del(`node_modules/${pkg}`);
        });
    } catch (error) {
        consola.error(error);
        return;
    }
    consola.success('删除成功');
};

// eslint-disable-next-line jsdoc/require-param
// 除了删除全局的文件，还要删除全局命令
async function delGlobal(name) {
    let pkg;
    try {
        pkg = await readPkg({
            cwd: path.resolve(globalNpm, 'node_modules', name)
        });
    } catch (error) {
        const similarNpm = await getSimilar(name);
        if (similarNpm.name) {
            const { action } = await inquirer.prompt([{
                type: 'confirm',
                message: `${name}不存在，你想删除的是${similarNpm.name}吗？`,
                default: true,
                name: 'action'
            }]);
            if (action) {
                pkg = await readPkg({
                    cwd: path.resolve(globalNpm, 'node_modules', similarNpm.name)
                });
                const cmds = pkg.bin ? Object.keys(pkg.bin) : [];
                await del(similarNpm.name, {
                    cwd: path.resolve(globalNpm, 'node_modules')
                });
                await pMap(cmds, async cmd => {
                    await del([ cmd, `${cmd}.cmd`, `${cmd}.ps1` ], {
                        cwd: globalNpm
                    });
                });
            }
        } else {
            consola.error('模块不存在');
            process.exit(1);
        }
    }
    const cmds = pkg.bin ? Object.keys(pkg.bin) : [];
    await del(name, {
        cwd: path.resolve(globalNpm, 'node_modules')
    });
    await pMap(cmds, async cmd => {
        await del([ cmd, `${cmd}.cmd`, `${cmd}.ps1` ], {
            cwd: globalNpm
        });
    });
}

async function getSimilar(name) {
    const similarNpm = `@${name.replace('-', '/')}`;
    if (similarNpm === `@${name}`) {
        return false;
    }
    try {
        await readPkg({
            cwd: path.resolve(globalNpm, 'node_modules', similarNpm)
        });
        return {
            name: similarNpm
        };
    } catch (error) {
        return false;
    }
}
