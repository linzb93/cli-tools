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
    const setting = db.setting.get('coverRate,saleRate');
    const answer = await inquirer.prompt([
        {
            type: 'input',
            message: '请输入当前仓位（单位：元）',
            filter: value => (isNaN(Number(value)) ? 0 : Number(value)),
            name: 'price'
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
            filter: value => (isNaN(Number(value)) ? setting.coverRate : Number(value)),
            default: setting.coverRate
        },
        {
            type: 'input',
            message: '请输入止盈百分比（单位：%）',
            name: 'saleRate',
            filter: value => (isNaN(Number(value)) ? setting.saleRate : Number(value)),
            default: setting.saleRate
        }
    ]);
    // 份额=持有金额/最新单价
    const data = db.fund.get(code);
    answer.share = Number((answer.price / data.history.slice(-1)[0].price).toFixed(2));
    delete answer.price;
    db.fund.updateInfo(answer);
    consola.success(`基金"${data.baseInfo.name}"信息更新成功`);
};
