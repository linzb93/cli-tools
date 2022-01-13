const inquirer = require('inquirer');
const db = require('./util/db');
const logger = require('../../util/logger');
const { checkDownloadCode, validateCode } = require('./util');
module.exports = async ([ code ]) => {
    if (!code) {
        const answer = await inquirer.prompt([
            {
                type: 'input',
                message: '请输入下跌补仓率（单位：%）',
                name: 'coverRate',
                filter: value => Number(value),
                validate: value => {
                    return Number.isInteger(value) && value > 1;
                },
                default: 4
            },
            {
                type: 'input',
                message: '请输入止盈百分比（单位：%）',
                name: 'saleRate',
                filter: value => Number(value),
                validate: value => {
                    return Number.isInteger(value) && value > 1;
                },
                default: 15
            }
        ]);
        db.setting.set('*', answer);
        return;
    }
    try {
        validateCode(code);
    } catch (error) {
        logger.error(error.message);
        return;
    }
    await checkDownloadCode(code);
    const setting = db.setting.get('coverRate,saleRate');
    const answer = await inquirer.prompt([
        {
            type: 'input',
            message: '请输入当前仓位（单位：元）',
            name: 'price',
            filter: value => Number(value),
            validate: value => {
                return Number.isInteger(value) && value >= 100;
            }
        },
        {
            type: 'input',
            message: '请输入当前盈利百分比（单位：%）',
            name: 'currentRate',
            filter: value => Number(value),
            validate: value => {
                return !isNaN(value);
            }
        },
        {
            type: 'input',
            message: '请输入下跌补仓率（单位：%）',
            name: 'coverRate',
            filter: value => Number(value),
            validate: value => {
                return Number.isInteger(value) && value > 1;
            },
            default: setting.coverRate
        },
        {
            type: 'input',
            message: '请输入止盈百分比（单位：%）',
            name: 'saleRate',
            filter: value => Number(value),
            validate: value => {
                return Number.isInteger(value) && value > 1;
            },
            default: setting.saleRate
        }
    ]);
    // 份额 = 持有金额 / 最新单价
    const data = db.fund.get(code);
    answer.share = Number((answer.price / data.lastestPrice).toFixed(2));
    delete answer.price;
    db.fund.updateInfo(code, answer);
    logger.success(`基金"${data.baseInfo.name}"信息更新成功`);
};
