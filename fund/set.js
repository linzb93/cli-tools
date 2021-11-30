const inquirer = require('inquirer');
const { db } = require('./util');
module.exports = async ([ code ]) => {
    if (!code) {
        const answer = await inquirer.prompt([
            {
                type: 'input',
                message: '请输入下跌补仓率（单位%）',
                name: 'fallPercent'
            },
            {
                type: 'input',
                message: '请输入止盈百分比（单位%）',
                name: 'stopPercent'
            }
        ]);
        db.setting.set('fallPercent', answer.fallPercent);
        db.setting.set('stopPercent', answer.stopPercent);
        return;
    }
    const data = db.fund.get(code);
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
            name: 'fallPercent'
        },
        {
            type: 'input',
            message: '请输入止盈百分比（单位%）',
            name: 'stopPercent'
        }
    ]);
};
