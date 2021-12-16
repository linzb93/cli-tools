const inquirer = require('inquirer');
const { db } = require('./util');
module.exports = async ([ code ]) => {
    if (!code) {
        const answer = await inquirer.prompt([
            {
                type: 'input',
                message: '请输入下跌补仓率（单位%）',
                name: 'fallPercent',
                filter: value => (isNaN(Number(value)) ? 4 : Number(value)),
                default: 4
            },
            {
                type: 'input',
                message: '请输入止盈百分比（单位%）',
                name: 'stopPercent',
                filter: value => (isNaN(Number(value)) ? 15 : Number(value)),
                default: 15
            }
        ]);
        db.setting.set('*', answer);
        return;
    }
    const data = db.setting.get('fallPercent,stopPercent');
    const answer = await inquirer.prompt([
        {
            type: 'input',
            message: '请输入当前仓位',
            name: 'positions'
        },
        {
            type: 'input',
            message: '请输入当前盈利百分比（单位%）',
            name: 'profitPercent'
        },
        {
            type: 'input',
            message: '请输入下跌补仓率（单位%）',
            name: 'fallPercent',
            filter: value => (isNaN(Number(value)) ? data.fallPercent : Number(value)),
            default: data.fallPercent
        },
        {
            type: 'input',
            message: '请输入止盈百分比（单位%）',
            name: 'stopPercent',
            filter: value => (isNaN(Number(value)) ? data.stopPercent : Number(value)),
            default: data.stopPercent
        }
    ]);
    db.fund.updateSetting(answer);
};
