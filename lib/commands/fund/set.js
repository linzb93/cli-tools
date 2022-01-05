const inquirer = require('inquirer');
const { db } = require('./util');
const consola = require('consola');
module.exports = async ([ code ]) => {
    if (!code) {
        const answer = await inquirer.prompt([
            {
                type: 'input',
                message: '请输入下跌补仓率（单位：%）',
                name: 'coverRate',
                filter: value => (isNaN(Number(value)) ? 4 : Number(value)),
                default: 4
            },
            {
                type: 'input',
                message: '请输入止盈百分比（单位：%）',
                name: 'saleRate',
                filter: value => (isNaN(Number(value)) ? 15 : Number(value)),
                default: 15
            }
        ]);
        db.setting.set('*', answer);
        return;
    }
    const data = db.setting.get('coverRate,saleRate');
    const answer = await inquirer.prompt([
        {
            type: 'input',
            message: '请输入当前仓位（单位：份）',
            filter: value => (isNaN(Number(value)) ? 0 : Number(value)),
            name: 'share'
        },
        {
            type: 'input',
            message: '请输入当前盈利百分比（单位：%）',
            filter: value => (isNaN(Number(value)) ? 0 : Number(value)),
            name: 'currentRate'
        },
        {
            type: 'input',
            message: '请输入下跌补仓率（单位：%）',
            name: 'coverRate',
            filter: value => (isNaN(Number(value)) ? data.coverRate : Number(value)),
            default: data.coverRate
        },
        {
            type: 'input',
            message: '请输入止盈百分比（单位：%）',
            name: 'saleRate',
            filter: value => (isNaN(Number(value)) ? data.saleRate : Number(value)),
            default: data.saleRate
        }
    ]);
    const ret = db.fund.updateSetting(code, answer);
    consola.success(`基金"${ret.name}"信息更新成功`);
};
