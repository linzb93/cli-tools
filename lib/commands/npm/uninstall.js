const consola = require('consola');
const inquirer = require('inquirer');
const pMap = require('p-map');
const del = require('del');
const getNpmList = require('./_internal/getList');
const { getVersion } = getNpmList;

module.exports = async args => {
    const name = args[0];
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
